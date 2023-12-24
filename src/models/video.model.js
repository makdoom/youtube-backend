import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String,
      required: [true, "Video file is required"],
    },
    thumbnail: {
      type: String,
      required: [true, "Video thumbnail is required"],
    },
    title: {
      type: String,
      required: [true, "Video title is required"],
    },
    desription: {
      type: String,
      required: [true, "Video description is required"],
    },
    duration: {
      type: Number,
      required: [true, "Video duration is required"],
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Aggregation Pipeline
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("User", videoSchema);
