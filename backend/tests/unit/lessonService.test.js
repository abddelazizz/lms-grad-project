import { jest } from "@jest/globals";
import { Op } from "sequelize";

const mockVerifySectionOwnership = jest.fn();
const mockLessonCount = jest.fn();
const mockLessonCreate = jest.fn();
const mockLessonFindOne = jest.fn();
const mockLessonFindByPk = jest.fn();
const mockLessonFindAll = jest.fn();
const mockLessonDestroy = jest.fn();
const mockCloudinaryDestroy = jest.fn();

jest.unstable_mockModule("../../src/models/Course.js", () => ({
  default: {},
}));

jest.unstable_mockModule("../../src/models/LessonContent.js", () => ({
  default: {
    count: mockLessonCount,
    create: mockLessonCreate,
    findOne: mockLessonFindOne,
    findByPk: mockLessonFindByPk,
    findAll: mockLessonFindAll,
    destroy: mockLessonDestroy,
  },
}));

jest.unstable_mockModule("../../src/services/sectionService.js", () => ({
  verifyCourseOwnership: jest.fn(),
  verifySectionOwnership: mockVerifySectionOwnership,
}));

jest.unstable_mockModule("../../src/utilis/AppError.js", () => ({
  default: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
    }
  },
}));

jest.unstable_mockModule("cloudinary", () => ({
  v2: {
    uploader: {
      destroy: mockCloudinaryDestroy,
    },
  },
}));

const { createUnifiedLesson, deleteLesson } = await import("../../src/services/lessonService.js");

describe("lessonService.createUnifiedLesson()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifySectionOwnership.mockResolvedValue({});
    mockLessonCount.mockResolvedValue(2);
    mockLessonCreate.mockImplementation(async (payload) => payload);
  });

  it("creates a top-level video lesson without parent_content_id", async () => {
    const file = {
      path: "https://cdn.example.com/video.mp4",
      filename: "lesson/video-1",
      duration: 95.8,
    };

    const lesson = await createUnifiedLesson(11, 4, "instructor", file, {
      title: "Intro Video",
      content_type: "video",
      is_free_preview: true,
    });

    expect(mockLessonFindOne).not.toHaveBeenCalled();
    expect(mockLessonCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        section_id: 11,
        parent_content_id: null,
        title: "Intro Video",
        content_type: "video",
        video_url: file.path,
        duration: 96,
        position_order: 3,
      })
    );
    expect(lesson.parent_content_id).toBeNull();
  });

  it("creates a child pdf lesson when the parent is a top-level video in the same section", async () => {
    mockLessonFindOne.mockResolvedValue({
      content_id: 7,
      section_id: 11,
      content_type: "video",
      parent_content_id: null,
    });

    const file = {
      path: "https://cdn.example.com/resource.pdf",
      filename: "lesson/resource-1",
    };

    await createUnifiedLesson(11, 4, "instructor", file, {
      title: "Slides",
      content_type: "pdf_lecture",
      is_free_preview: false,
      parent_content_id: "7",
    });

    expect(mockLessonFindOne).toHaveBeenCalledWith({
      where: {
        content_id: 7,
        section_id: 11,
      },
    });
    expect(mockLessonCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        parent_content_id: 7,
        file_url: file.path,
        content_type: "pdf_lecture",
      })
    );
  });

  it("rejects a child lesson whose parent is not a video", async () => {
    mockLessonFindOne.mockResolvedValue({
      content_id: 7,
      section_id: 11,
      content_type: "pdf_lecture",
      parent_content_id: null,
    });

    await expect(
      createUnifiedLesson(11, 4, "instructor", { path: "x", filename: "y" }, {
        title: "Nested PDF",
        content_type: "pdf_assignment",
        parent_content_id: "7",
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Only video lessons can be used as parent lessons.",
    });
  });
});

describe("lessonService.deleteLesson()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifySectionOwnership.mockResolvedValue({});
    mockCloudinaryDestroy.mockResolvedValue({});
  });

  it("soft-deletes the parent lesson and its child attachments, then cleans up Cloudinary assets", async () => {
    mockLessonFindByPk.mockResolvedValue({
      content_id: 5,
      section_id: 11,
      content_type: "video",
      cloudinary_public_id: "lesson/video-5",
    });
    mockLessonFindAll.mockResolvedValue([
      {
        content_id: 6,
        parent_content_id: 5,
        content_type: "pdf_lecture",
        cloudinary_public_id: "lesson/pdf-6",
      },
      {
        content_id: 7,
        parent_content_id: 5,
        content_type: "pdf_assignment",
        cloudinary_public_id: "lesson/pdf-7",
      },
    ]);

    await deleteLesson(5, 4, "instructor");

    expect(mockLessonDestroy).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { content_id: 5 },
          { parent_content_id: 5 },
        ],
      },
    });
    expect(mockCloudinaryDestroy).toHaveBeenCalledTimes(3);
    expect(mockCloudinaryDestroy).toHaveBeenCalledWith("lesson/video-5", { resource_type: "video" });
    expect(mockCloudinaryDestroy).toHaveBeenCalledWith("lesson/pdf-6", { resource_type: "raw" });
    expect(mockCloudinaryDestroy).toHaveBeenCalledWith("lesson/pdf-7", { resource_type: "raw" });
  });
});
