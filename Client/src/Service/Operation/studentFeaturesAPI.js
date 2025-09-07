import { toast } from "react-hot-toast"
import rzpLogo from "../../Asset/Logo/rzp_logo.png"
import { resetCart } from "../../Slice/cartSlice"
import { setPaymentLoading } from "../../Slice/courseSlice"
import { apiConnector } from "../apiConnector"
import { studentEndpoints } from "../apis"

const {
  COURSE_PAYMENT_API,
  COURSE_VERIFY_API,
  SEND_PAYMENT_SUCCESS_EMAIL_API,
} = studentEndpoints

// Load the Razorpay SDK from the CDN
function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = src
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// Buy the Course
export async function BuyCourse(token, courses, user_details, navigate, dispatch) {
  const toastId = toast.loading("Loading...")

  try {
    const scriptLoaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js")
    if (!scriptLoaded) {
      toast.dismiss(toastId)
      toast.error("Failed to load Razorpay SDK. Check your internet connection.")
      return
    }

    // Call backend to create order
    const orderResponse = await apiConnector(
      "POST",
      COURSE_PAYMENT_API,
      { courses },
      { Authorization: `Bearer ${token}` }
    )

    if (!orderResponse?.data?.success) {
      throw new Error(orderResponse?.data?.message || "Order creation failed")
    }

    const { id, amount, currency } = orderResponse.data.data

    const options = {
      key: "rzp_test_t4LUM04KXw6wHc", // Replace with production key in production
      amount: amount.toString(),
      currency,
      name: "StudyNotion",
      description: "Thank you for purchasing the course.",
      image: rzpLogo,
      order_id: id,
      prefill: {
        name: `${user_details.firstName} ${user_details.lastName}`,
        email: user_details.email,
      },
    handler: function (response) {
        sendPaymentSuccessEmail(response, orderResponse.data.data.amount, token)
        verifyPayment({ ...response, courses }, token, navigate, dispatch)
      },
      theme: {
        color: "#3399cc",
      },
    }

    const rzp = new window.Razorpay(options)

    rzp.on("payment.failed", function (response) {
      toast.error("Payment Failed. Please try again.")
      console.error("Payment failed:", response.error)
    })

    rzp.open()

  } catch (error) {
    console.error("Error in BuyCourse:", error)
    toast.error("Payment process failed. Please try again.")
  } finally {
    toast.dismiss(toastId)
  }
}

// Verify Payment with backend
async function verifyPayment(bodyData, token, navigate, dispatch) {
  const toastId = toast.loading("Verifying Payment...")
  dispatch(setPaymentLoading(true))

  try {
    const response = await apiConnector(
      "POST",
      COURSE_VERIFY_API,
      bodyData,
      { Authorization: `Bearer ${token}` }
    )

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Verification failed")
    }

    toast.success("Payment Successful! You are enrolled in the course.")
    dispatch(resetCart())
    navigate("/dashboard/enrolled-courses")

  } catch (error) {
    console.error("Payment verification failed:", error)
    toast.error("Could not verify payment.")
  } finally {
    toast.dismiss(toastId)
    dispatch(setPaymentLoading(false))
  }
}

// Send Payment Success Email
async function sendPaymentSuccessEmail(response, amount, token) {
  try {
    await apiConnector(
      "POST",
      SEND_PAYMENT_SUCCESS_EMAIL_API,
      {
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        amount,
      },
      { Authorization: `Bearer ${token}` }
    )
  } catch (error) {
    console.error("Failed to send success email:", error)
  }
}
