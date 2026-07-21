import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title for the course"],
      trim: true,
      maxlength: [100, "Course title must be less than 100 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, "Course subtitle must be less than 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description for the course"],
      trim: true,
      maxlength: [1000, "Course description must be less than 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Please provide a category for the course"],
      trim: true,
    },
    level: {
      type: String,
      enum: {
        values: ["beginner", "intermediate", "advanced"],
        message: "Level must be either beginner, intermediate or advanced",
      },
      required: [true, "Please provide a level for the course"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Please provide a price for the course"],
      min: [0, "Price must be greater than or equal to 0"],
    },
    thumbnail: {
      type: String,
      required: [true, "Please provide a thumbnail for the course"],
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide an instructor for the course"],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    totalLectures: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

courseSchema.virtual("averageRating").get(function () {
  if (this.ratings.length === 0) {
    return 0;
  }
  const totalRating = this.ratings.reduce(
    (acc, rating) => acc + rating.rating,
    0,
  );
  return totalRating / this.ratings.length;
});

courseSchema.pre("save", function (next) {
  if (this.lectures && this.lectures.length > 0) {
    this.totalLectures = this.lectures.length;
  }
  next();
});

export const Course = mongoose.model("Course", courseSchema);
