import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AppTitleStrategy } from './app-title.strategy';
import { APP_NAME, PageTitleService } from './page-title.service';

@Component({ template: '' })
class BlankPageComponent {}

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        {
          path: 'pomodoro',
          title: 'Pomodoro',
          children: [
            { path: '', component: BlankPageComponent },
            { path: 'summary', title: 'Weekly Summary', component: BlankPageComponent },
          ],
        },
        { path: 'untitled', component: BlankPageComponent },
      ]),
      { provide: TitleStrategy, useClass: AppTitleStrategy },
    ],
  });
  return { title: TestBed.inject(Title) };
}

describe('AppTitleStrategy', () => {
  test('should suffix the route title with the app name', async () => {
    const { title } = setup();
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/pomodoro/summary');

    expect(title.getTitle()).toBe(`Weekly Summary · ${APP_NAME}`);
  });

  test('should fall back to the parent route title when the child has none', async () => {
    const { title } = setup();
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/pomodoro');

    expect(title.getTitle()).toBe(`Pomodoro · ${APP_NAME}`);
  });

  test('should show only the app name when no route in the tree has a title', async () => {
    const { title } = setup();
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/untitled');

    expect(title.getTitle()).toBe(APP_NAME);
  });
});

describe('PageTitleService', () => {
  test('should let a page replace the route title with its loaded entity name', () => {
    const { title } = setup();

    TestBed.inject(PageTitleService).set('Clean Architecture');

    expect(title.getTitle()).toBe(`Clean Architecture · ${APP_NAME}`);
  });
});
