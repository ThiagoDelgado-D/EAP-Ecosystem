import {
  createValidationSchema,
  type CryptoService,
  InvalidDataError,
  optionalEnum,
  optionalString,
  optionalNumber,
  stringField,
  urlField,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import {
  NodeProgress,
  StubScope,
  type ILearningPathRepository,
  type LearningPathNode,
} from "@learning-resource/domain";
import {
  LearningPathForbiddenError,
  LearningPathNotFoundError,
} from "../../errors/learning-path-errors.js";

export interface AddLearningPathNodeDependencies {
  learningPathRepository: ILearningPathRepository;
  cryptoService: CryptoService;
}

export interface AddLearningPathNodeRequest {
  userId: UUID;
  pathId: UUID;
  title: string;
  description?: string;
  externalUrl?: string;
  learningResourceId?: UUID;
  stubScope?: StubScope;
  order?: number;
  progress?: NodeProgress;
}

const addLearningPathNodeSchema = createValidationSchema<AddLearningPathNodeRequest>({
  userId: uuidField("UserId", { required: true }),
  pathId: uuidField("PathId", { required: true }),
  title: stringField("Title", { required: true, maxLength: 200 }),
  description: optionalString("Description", { maxLength: 1000 }),
  externalUrl: urlField("ExternalUrl", { required: false, allowEmpty: true }),
  learningResourceId: uuidField("LearningResourceId", { required: false }),
  stubScope: optionalEnum(Object.values(StubScope) as StubScope[], "StubScope"),
  order: optionalNumber("Order", { integer: true }),
  progress: optionalEnum(Object.values(NodeProgress) as NodeProgress[], "Progress"),
});

export const addLearningPathNode = async (
  { learningPathRepository, cryptoService }: AddLearningPathNodeDependencies,
  request: AddLearningPathNodeRequest,
): Promise<
  LearningPathNode | LearningPathNotFoundError | LearningPathForbiddenError | InvalidDataError
> => {
  const validationResult = await addLearningPathNodeSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { userId, pathId, title, description, externalUrl, learningResourceId, stubScope, order, progress } = validationResult;

  const path = await learningPathRepository.findById(pathId);
  if (!path) return new LearningPathNotFoundError();
  if (path.userId !== userId) return new LearningPathForbiddenError();

  const id = await cryptoService.generateUUID();
  const now = new Date();

  const node: LearningPathNode = learningResourceId
    ? {
        id,
        pathId,
        title,
        description,
        externalUrl,
        learningResourceId,
        order,
        progress: progress ?? NodeProgress.PENDING,
        createdAt: now,
        updatedAt: now,
      }
    : {
        id,
        pathId,
        title,
        description,
        externalUrl,
        stubScope: stubScope ?? StubScope.PATH_LOCAL,
        order,
        progress: progress ?? NodeProgress.PENDING,
        createdAt: now,
        updatedAt: now,
      };

  return learningPathRepository.saveNode(node);
};
