import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  title : {
    type : String,
    required : true,
    trim : true,
    maxlength : [100, "Lecture title must be less than 100 characters"]
  }, 
  description : {
    type : String,
    trim : true,
    maxlength : [1000, "Lecture description must be less than 1000 characters"]
  } , 
  videoUrl : {
    type : String,
    required : [true, "Please provide a video URL for the lecture"],
  },
    duration : {
      type : Number,
      default : 0,
    },
    publicId : {
      type : String,
      required : [true, "Please provide a public ID for the lecture video"],
    } ,
    isPreview : {
      type : Boolean,
      default : false,
    } , 
    order : {
      type : Number,
      required : [true, "Please provide an order for the lecture"],
    }
} ,{
  timestamps : true,
  toJSON : {virtuals : true},
  toObject : {virtuals : true}
})

lectureSchema.pre("save", async function (next) {
  if(this.duration){
    this.duration = Math.round(this.duration * 100) / 100;
  }
  next();
})

export const Lecture = mongoose.model("Lecture", lectureSchema);