import {
  createValidationSchema,
  type CryptoService,
  enumField,
  InvalidDataError,
  optionalEnum,
  optionalString,
  stringField,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import {
  PathMode,
  PathSource,
  type ILearningPathRepository,
  type LearningPath,
} from "@learning-resource/domain";
export interface CreateLearningPathDependencies {
  learningPathRepository: ILearningPathRepository;
  cryptoService: CryptoService;
}

export interface CreateLearningPathRequest {
  userId: UUID;
  title: string;
  description?: string;
  mode: PathMode;
  source?: PathSource;
  sourceSlug?: string;
}

const createLearningPathSchema = createValidationSchema<CreateLearningPathRequest>({
  userId: uuidField("UserId", { required: true }),
  title: stringField("Title", { required: true, maxLength: 200 }),
  description: optionalString("Description", { maxLength: 1000 }),
  mode: enumField(Object.values(PathMode) as PathMode[], "Mode", { required: true }),
  source: optionalEnum(Object.values(PathSource) as PathSource[], "Source"),
  sourceSlug: optionalString("SourceSlug", { maxLength: 100 }),
});

export const createLearningPath = async (
  { learningPathRepository, cryptoService }: CreateLearningPathDependencies,
  request: CreateLearningPathRequest,
): Promise<LearningPath | InvalidDataError> => {
  const validationResult = await createLearningPathSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const validated = validationResult;
  const id = await cryptoService.generateUUID();
  const now = new Date();

  const path: LearningPath = {
    id,
    userId: validated.userId,
    title: validated.title,
    description: validated.description,
    mode: validated.mode,
    source: validated.source ?? PathSource.MANUAL,
    sourceSlug: validated.sourceSlug,
    createdAt: now,
    updatedAt: now,
  };

  return learningPathRepository.save(path);
};
