import React, { useEffect, useState } from "react"
import { BiInfoCircle } from "react-icons/bi"
import { HiOutlineGlobeAlt } from "react-icons/hi"
import { ReactMarkdown } from "react-markdown/lib/react-markdown"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"

import ConfirmationModal from "../Component/Common/ConfirmationModal"
import Footer from "../Component/Common/Footer"
import RatingStars from "../Component/Common/RatingStars"
import CourseAccordionBar from "../Component/Core/Course/CourseAccordionBar"
import CourseDetailsCard from "../Component/Core/Course/CourseDetailsCard"

import { formatDate } from "../Service/formatDate"
import { fetchCourseDetails } from "../Service/Operation/courseDetailsAPI"
import { BuyCourse } from "../Service/Operation/studentFeaturesAPI"
import GetAvgRating from "../Util/avgRating"
import Error from "./Error"

const CourseDetails = () => {
    console.log("✅ CourseDetails component mounted")
  const { courseId } = useParams()
  console.log("courseId from params:", courseId)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.profile)
  const { token } = useSelector((state) => state.auth)

  const [loading, setLoading] = useState(false)
  const [courseData, setCourseData] = useState(null)
  const [confirmationModal, setConfirmationModal] = useState(null)
  const [activeSections, setActiveSections] = useState([])

  // Fetch Course Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetchCourseDetails(courseId)
        console.log("Full API Response:", response)
         

      // 👇 Add these two logs here
      console.log("courseId:", courseId)
      console.log("courseData:", response.data)

        if (response.success && response.data) {
          console.log("Setting courseData:", response.data)
        setCourseData(response.data.courseDetails)
        } else {
          console.warn("Invalid response structure:", response)
          setCourseData(null)
        }
      } catch (error) {
        console.error("Error fetching course details:", error)
        setCourseData(null)
      }
      setLoading(false)
    }

    if (courseId) fetchData()
  }, [courseId])

  // Accordion toggle
  const handleActive = (sectionId) => {
    setActiveSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  // Buy course
const handleBuyCourse = async () => {
  if (!token) {
    setConfirmationModal({
      text1: "You are not logged in!",
      text2: "Please login to buy this course",
      btn1Text: "Login",
      btn2Text: "Cancel",
      btn1Handler: () => navigate("/login"),
      btn2Handler: () => setConfirmationModal(null),
    })
    return
  }

  try {
    await BuyCourse(token, [courseId], user, navigate, dispatch)   // ✅ sab pass karna
  } catch (err) {
    console.error("Error buying course:", err)
  }
}



  if (loading) {
    return <p className="text-center text-gray-400 mt-10">Loading...</p>
  }

  if (
    !courseData ||
    Object.keys(courseData).length === 0 ||
    !courseData.courseName ||
    !Array.isArray(courseData.courseContent)
  ) {
    console.warn("Rendering fallback due to invalid courseData:", courseData)
    return <Error />
  }

  const {
    courseName,
    courseDescription,
    price,
    whatYouWillLearn,
    instructor,
    createdAt,
    thumbnail,
    courseContent,
    ratingAndReviews,
    studentsEnrolled,
    instructions,
    status,
  } = courseData

  const avgRating = GetAvgRating(ratingAndReviews)

  return (
    <div className="text-white bg-richblack-900">
      {/* Top Section */}
      <div className="relative w-full bg-richblack-800 p-6 md:p-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          {/* Left side content */}
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl font-bold">{courseName}</h1>
            <p className="text-gray-300">{courseDescription}</p>

            <div className="flex items-center gap-4 text-yellow-300">
              <RatingStars Review_Count={avgRating} Star_Size={24} />
              <span>{`(${Array.isArray(ratingAndReviews) ? ratingAndReviews.length : 0} reviews)`}</span>
              <span>{`${Array.isArray(studentsEnrolled) ? studentsEnrolled.length : 0} students enrolled`}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-400">
              <p>Created by {instructor?.firstName + " " + instructor?.lastName}</p>
              <p>Created At: {formatDate(createdAt)}</p>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-400">
              <HiOutlineGlobeAlt />
              <span>English</span>
            </div>
          </div>

          {/* Right side card */}
          <div className="w-full md:w-[400px]">
            <CourseDetailsCard
              course={courseData}
              setConfirmationModal={setConfirmationModal}
              handleBuyCourse={handleBuyCourse}
            />
          </div>
        </div>
      </div>

      {/* What you will learn */}
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <h2 className="text-2xl font-semibold mb-4">What you'll learn</h2>
        <ReactMarkdown className="text-gray-300">{whatYouWillLearn}</ReactMarkdown>
      </div>

      {/* Course Content Accordion */}
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <h2 className="text-2xl font-semibold mb-4">Course Content</h2>
        <div className="space-y-2">
          {courseContent.map((section) => (
            <CourseAccordionBar
              key={section._id}
              course={section}
              isActive={activeSections}
              handleActive={handleActive}
            />
          ))}
        </div>
      </div>

      {/* Pre-requisites */}
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <h2 className="text-2xl font-semibold mb-4">Requirements</h2>
        <ul className="list-disc list-inside text-gray-300">
          {Array.isArray(instructions) &&
            instructions.map((req, i) => <li key={i}>{req}</li>)}
        </ul>
      </div>

      {/* Footer */}
      <Footer />

      {/* Confirmation Modal */}
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </div>
  )
}

export default CourseDetails
