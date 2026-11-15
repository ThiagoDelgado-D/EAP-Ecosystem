#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::webview::PageLoadEvent;
use tauri::{AppHandle, Manager, RunEvent, Url, WebviewUrl, WebviewWindowBuilder};

const KEYRING_SERVICE: &str = "study.cauce.desktop";
const KEYRING_USER: &str = "secrets";

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Secrets {
    database_key: String,
    jwt_secret: String,
    refresh_token_secret: String,
}

#[derive(Clone)]
struct SharedStdin(Arc<Mutex<ChildStdin>>);

impl SharedStdin {
    fn send(&self, message: &serde_json::Value) {
        let mut stdin = self.0.lock().unwrap();
        let _ = writeln!(stdin, "{message}");
        let _ = stdin.flush();
    }
}

struct Api {
    child: Child,
    stdin: SharedStdin,
}

#[derive(Default)]
struct ApiState(Mutex<Option<Api>>);

fn random_hex() -> String {
    let mut bytes = [0u8; 32];
    getrandom::fill(&mut bytes).expect("the OS random source is unavailable");
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn load_secrets() -> Result<Secrets, Box<dyn std::error::Error>> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)?;
    match entry.get_password() {
        Ok(stored) => Ok(serde_json::from_str(&stored)?),
        Err(keyring::Error::NoEntry) => {
            let secrets = Secrets {
                database_key: format!("x'{}'", random_hex()),
                jwt_secret: random_hex(),
                refresh_token_secret: random_hex(),
            };
            entry.set_password(&serde_json::to_string(&secrets)?)?;
            Ok(secrets)
        }
        Err(error) => Err(error.into()),
    }
}

fn free_port() -> u16 {
    TcpListener::bind("127.0.0.1:0")
        .and_then(|listener| listener.local_addr())
        .map(|address| address.port())
        .expect("no free local port")
}

fn node_binary() -> PathBuf {
    let name = if cfg!(windows) { "node.exe" } else { "node" };
    std::env::current_exe()
        .expect("cannot locate the app executable")
        .with_file_name(name)
}

fn start_api(resources: &Path, data_dir: &Path, port: u16, secrets: &Secrets) -> Api {
    let mut command = Command::new(node_binary());
    command
        .arg(resources.join("api").join("server").join("main.mjs"))
        .env("DESKTOP_SHELL", "stdio")
        .env("NODE_ENV", "development")
        .env("HOST", "127.0.0.1")
        .env("PORT", port.to_string())
        .env("DB_TYPE", "sqlite")
        .env("DB_PATH", data_dir.join("cauce.db"))
        .env("WEB_DIST", resources.join("web"))
        .env("JWT_SECRET", &secrets.jwt_secret)
        .env("REFRESH_TOKEN_SECRET", &secrets.refresh_token_secret)
        .env("SMTP_HOST", "127.0.0.1")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = command.spawn().expect("cannot start the API");
    let stdin = SharedStdin(Arc::new(Mutex::new(child.stdin.take().expect("API stdin is piped"))));
    let stdout = child.stdout.take().expect("API stdout is piped");

    let responder = stdin.clone();
    let database_key = secrets.database_key.clone();
    thread::spawn(move || {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            if line.contains("\"database-key-request\"") {
                responder.send(&serde_json::json!({ "type": "database-key", "databaseKey": database_key }));
            } else {
                println!("{line}");
            }
        }
    });

    Api { child, stdin }
}

fn is_serving(port: u16) -> bool {
    let Ok(mut stream) = TcpStream::connect(("127.0.0.1", port)) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
    if write!(stream, "GET / HTTP/1.0\r\nHost: 127.0.0.1\r\n\r\n").is_err() {
        return false;
    }
    let mut status = [0u8; 12];
    stream.read_exact(&mut status).is_ok() && status.ends_with(b"200")
}

fn epoch_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|elapsed| elapsed.as_millis())
        .unwrap_or_default()
}

fn open_window(app: &AppHandle, origin: Url) {
    let allowed = origin.clone();
    let reported = AtomicBool::new(false);
    WebviewWindowBuilder::new(app, "main", WebviewUrl::External(origin))
        .title("Cauce")
        .inner_size(1280.0, 800.0)
        .on_navigation(move |url| url.origin() == allowed.origin())
        .on_page_load(move |_, payload| {
            if payload.event() != PageLoadEvent::Finished || reported.swap(true, Ordering::SeqCst) {
                return;
            }
            if let Ok(file) = std::env::var("CAUCE_MEASURE_FILE") {
                let _ = std::fs::write(file, epoch_millis().to_string());
            }
        })
        .build()
        .expect("cannot open the app window");
}

fn main() {
    let app = tauri::Builder::default()
        .manage(ApiState::default())
        .setup(|app| {
            let handle = app.handle().clone();
            let resources = dunce::simplified(&app.path().resource_dir()?).to_path_buf();
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            let secrets = load_secrets()?;
            let port = free_port();
            let api = start_api(&resources, &data_dir, port, &secrets);
            *app.state::<ApiState>().0.lock().unwrap() = Some(api);

            thread::spawn(move || {
                while !is_serving(port) {
                    thread::sleep(Duration::from_millis(100));
                }
                let origin = Url::parse(&format!("http://127.0.0.1:{port}/")).unwrap();
                open_window(&handle, origin);
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("cannot build the app");

    app.run(|handle, event| {
        if let RunEvent::ExitRequested { api, .. } = event {
            let Some(mut running) = handle.state::<ApiState>().0.lock().unwrap().take() else {
                return;
            };
            api.prevent_exit();
            running.stdin.send(&serde_json::json!({ "type": "shutdown" }));
            let handle = handle.clone();
            thread::spawn(move || {
                let _ = running.child.wait();
                handle.exit(0);
            });
        }
    });
}
