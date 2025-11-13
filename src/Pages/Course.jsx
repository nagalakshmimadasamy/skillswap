import { Link, useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, collection, addDoc, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { auth, db } from "../assets/Firebase/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const Course = () => {
  const { id } = useParams()
  const [skill, setSkill] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("")
  const [author, setAuthor] = useState("")
  const [tags, setTags] = useState([])
  const [uid, setUid] = useState("")
  const [openLoginDialog, setOpenLoginDialog] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [openChat, setOpenChat] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])

  // Rating system states
  const [ratings, setRatings] = useState([])
  const [userRating, setUserRating] = useState(0)
  const [avgRating, setAvgRating] = useState(0)

  const nav = useNavigate()

  const getData = async () => {
    try {
      const docRef = doc(db, "Skills", id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setAuthor(docSnap.data().author)
        setStatus(docSnap.data().status)
        setSkill(docSnap.data().skill)
        setDescription(docSnap.data().description)
        setTags(docSnap.data().tags)
        setUid(docSnap.data().uid)
      }
    } catch (error) {
      console.error("Failed to fetch skills:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const fetchRatings = async () => {
    if (!uid) return
    try {
      const ratingsRef = collection(db, "Ratings")
      const q = query(ratingsRef, where("teacherUid", "==", uid))
      const snapshot = await getDocs(q)
      const ratingArr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setRatings(ratingArr)

      if (ratingArr.length > 0) {
        const total = ratingArr.reduce((acc, cur) => acc + cur.rating, 0)
        setAvgRating((total / ratingArr.length).toFixed(1))
      } else {
        setAvgRating(0)
      }

      if (currentUser) {
        const userRate = ratingArr.find(r => r.userUid === currentUser.uid)
        if (userRate) setUserRating(userRate.rating)
      }
    } catch (error) {
      console.error("Failed to fetch ratings:", error)
    }
  }

  const submitRating = async (value) => {
    if (!currentUser) return setOpenLoginDialog(true)

    try {
      const ratingsRef = collection(db, "Ratings")
      const existing = ratings.find(r => r.userUid === currentUser.uid)
      if (existing) {
        await setDoc(doc(db, "Ratings", existing.id), { rating: value, teacherUid: uid, userUid: currentUser.uid })
      } else {
        await addDoc(ratingsRef, { rating: value, teacherUid: uid, userUid: currentUser.uid })
      }
      setUserRating(value)
      fetchRatings()
    } catch (error) {
      console.error("Error submitting rating:", error)
    }
  }

  const checkLogin = () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        await getData()
        fetchRatings()
      } else {
        setOpenLoginDialog(true)
        setDataLoading(false)
      }
    })
  }

  useEffect(() => {
    checkLogin()
  }, [])

  useEffect(() => {
    if (skill && author) {
      document.title = `${skill} - ${author}`
    }
  }, [skill, author])

  // Fetch real-time chat messages
  useEffect(() => {
    if (!currentUser || !uid) return

    const chatId = [currentUser.uid, uid].sort().join("_")
    const messagesQuery = query(
      collection(db, "Chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data())
      setMessages(msgs)
    })

    return () => unsubscribe()
  }, [currentUser, uid])

  const sendMessage = async () => {
    if (!message.trim()) return

    const chatId = [currentUser.uid, uid].sort().join("_")

    try {
      const chatRef = doc(db, "Chats", chatId)
      const chatSnap = await getDoc(chatRef)
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [currentUser.uid, uid],
          skill: skill
        })
      }

      await addDoc(collection(db, "Chats", chatId, "messages"), {
        sender: currentUser.uid,
        text: message,
        timestamp: new Date()
      })

      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  if (dataLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap justify-center items-start gap-5 p-6">
        <div className="w-full border border-gray-200 px-4 py-3 rounded-lg sm:w-auto sm:min-w-60">
          <div className="px-5 py-3 rounded-t-xl">
            <h1 className="text-xl font-semibold mb-1">{skill}</h1>
            <h1 className="mb-2">{description}</h1>
            <button className={`text-white px-2.5 py-0.5 rounded text-sm mb-1 ${status === "Teach" ? "bg-green-400" : "bg-yellow-400"}`}>{status}</button>
            <div className="flex flex-wrap justify-start items-center gap-1.5 my-3">
              {tags.map((e, i) => (
                <button key={i} className="bg-white border-1 border-indigo-600 text-indigo-600 py-0.5 px-2.5 rounded font-medium">{e.toUpperCase()}</button>
              ))}
            </div>
            <Link to={`/seeprofile/${uid}`}><h1 className="transition duration-200 hover:text-indigo-600 text-sm text-gray-600">{author}</h1></Link>

            {/* Rating System */}
            <div className="mt-2">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((star) => (
                  <span
                    key={star}
                    onClick={() => submitRating(star)}
                    className={`cursor-pointer text-xl ${star <= userRating ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    ★
                  </span>
                ))}
                <span className="ml-2 text-sm text-gray-600">{avgRating} / 5</span>
              </div>
            </div>

            {currentUser && uid && currentUser.uid !== uid && (
              <button
                onClick={() => setOpenChat(true)}
                className="mt-3 w-full bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-500 text-sm"
              >
                Chat with {author}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Login dialog */}
      <Dialog open={openLoginDialog} onClose={() => { }} className="relative z-10">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-200 sm:mx-0 sm:size-10">
                    <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-gray-900" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" className="text-base font-semibold text-gray-900">Login</DialogTitle>
                    <p className="text-sm text-gray-500 mt-2">Login to your SkillSwap account to view this page.</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button type="button" onClick={() => nav("/login")} className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 cursor-pointer sm:ml-3 sm:w-auto">Login</button>
                <button type="button" onClick={() => nav('/')} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto">Go to Home</button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Real-time chat modal */}
      <Dialog open={openChat} onClose={() => setOpenChat(false)} className="relative z-10">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
        <div className="fixed inset-0 z-10 w-screen flex items-center justify-center">
          <DialogPanel className="bg-white rounded-lg p-4 w-80 flex flex-col">
            <DialogTitle className="text-lg font-semibold">Chat with {author}</DialogTitle>
            <div className="flex-grow overflow-y-auto border border-gray-200 rounded p-2 mt-2 mb-2 h-48">
              {messages.map((msg, i) => (
                <div key={i} className={`mb-1 p-1 rounded ${msg.sender === currentUser.uid ? "bg-indigo-100 text-right" : "bg-gray-100 text-left"}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-grow border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button className="bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-500 text-sm" onClick={sendMessage}>Send</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

export default Course
