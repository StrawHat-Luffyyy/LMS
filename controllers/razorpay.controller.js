import Razorpay from "razorpay";
import { CoursePurchase } from "../models/coursePurchase.model";
import { Course } from "../models/course.model";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { userId } = req.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: "error",
        message: "Course not found",
      });
    }
    const newCoursePurchase = new CoursePurchase({
      user: userId,
      course: courseId,
      amount: course.price,
      paymentMethod: "razorpay",
      status: "pending",
    });

    const options = {
      amount: course.price * 100, // Amount in paise
      currency: "INR",
      receipt: newCoursePurchase._id.toString(),
      notes: {
        courseId: courseId,
        userId: userId,
      },
    };
    const order = await razorpay.orders.create(options);
    newCoursePurchase.paymentId = order.id;
    await newCoursePurchase.save();
    res.status(201).json({
      status: "success",
      message: "Razorpay order created successfully",
      data: { order },
      course: {
        id: course._id,
        title: course.title,
        price: course.price,
        thumbnail: course.thumbnail,
        level: course.level,
        category: course.category,
        description: course.description,
        instructor: {
          id: course.instructor._id,
          name: course.instructor.name,
          email: course.instructor.email,
        },
      },
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        status: "error",
        message: "Invalid signature",
      });
    }
    const coursePurchase = await CoursePurchase.findOne({ paymentId: orderId });
    if (!coursePurchase) {
      return res.status(404).json({
        status: "error",
        message: "Course purchase not found",
      });
    }
    coursePurchase.status = "completed";
    await coursePurchase.save();
    res.status(200).json({
      status: "success",
      message: "Payment verified successfully",
      data: { coursePurchase },
    });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
