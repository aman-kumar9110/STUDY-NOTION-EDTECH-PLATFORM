import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { setCourse } from "../../../../../Slice/courseSlice"


import { editCourseDetails } from "../../../../../Service/Operation/courseDetailsAPI"
import { resetCourseState, setStep } from "../../../../../Slice/courseSlice"
import { COURSE_STATUS } from "../../../../../Util/constants"
import IconBtn from "../../../../Common/IconBtn"

export default function PublishCourse() {
  const { register, handleSubmit, setValue, getValues } = useForm()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token } = useSelector((state) => state.auth)
  const { course } = useSelector((state) => state.course)
  const [loading, setLoading] = useState(false)

  // agar course pehle se publish hai to checkbox ticked rahe
  useEffect(() => {
    if (course?.status === COURSE_STATUS.PUBLISHED) {
      setValue("public", true)
    }
  }, [course, setValue])

  const goBack = () => {
    dispatch(setStep(2))
  }

  const goToCourses = () => {
    console.log("➡️ Navigating to My Courses page...")
    dispatch(resetCourseState())
    navigate("/dashboard/my-courses")
  }

  const handleCoursePublish = async () => {
    setLoading(true)

    const checkboxValue = getValues("public")
    console.log("🔍 Checkbox Value:", checkboxValue)

    const isPublic = checkboxValue === true || checkboxValue === "true"
    console.log("✅ Interpreted isPublic:", isPublic)

    const courseStatus = isPublic ? COURSE_STATUS.PUBLISHED : COURSE_STATUS.DRAFT
    console.log("📌 Final Course Status:", courseStatus)

    // agar status change nahi hua to seedha dashboard pe bhej do
    if (
      (course?.status === COURSE_STATUS.PUBLISHED && isPublic) ||
      (course?.status === COURSE_STATUS.DRAFT && !isPublic)
    ) {
      console.log("⚠️ Status same hai, koi update nahi. Redirecting...")
      setLoading(false)
      goToCourses()
      return
    }

    const payload = {
      courseId: course._id,
      updates: { status: courseStatus },
    }
    console.log("📦 Payload bheja ja raha hai:", payload)

    const result = await editCourseDetails(payload, token)
    console.log("🛠 API Result:", result)

    setLoading(false)
   if (result) {
  dispatch(setCourse({ ...course, status: courseStatus }))
  goToCourses()
}else {
      console.log("❌ API call failed, course update nahi hua.")
    }
  }

  const onSubmit = () => {
    console.log("🚀 Form Submitted")
    handleCoursePublish()
  }

  return (
    <div className="rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-6">
      <p className="text-2xl font-semibold text-richblack-5">Publish Settings</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Checkbox */}
        <div className="my-6 mb-8">
          <label htmlFor="public" className="inline-flex items-center text-lg">
            <input
              type="checkbox"
              id="public"
              {...register("public")}
              value="true"
              className="border-gray-300 h-4 w-4 rounded bg-richblack-500 text-richblack-400 focus:ring-2 focus:ring-richblack-5"
            />
            <span className="ml-2 text-richblack-400">
              Make this course public
            </span>
          </label>
        </div>

        {/* Next Prev Button */}
        <div className="ml-auto flex max-w-max items-center gap-x-4">
          <button
            disabled={loading}
            type="button"
            onClick={goBack}
            className="flex cursor-pointer items-center gap-x-2 rounded-md bg-richblack-300 py-[8px] px-[20px] font-semibold text-richblack-900 uppercase tracking-wider"
          >
            Back
          </button>
          <IconBtn disabled={loading} text="Save Changes" />
        </div>
      </form>
    </div>
  )
}
