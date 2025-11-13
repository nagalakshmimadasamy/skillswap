import {
    collection,
    query,
    getDocs,
    where,
    orderBy,
    startAt,
    endAt,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../assets/Firebase/Firebase";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

const Home = () => {
    const type = [
        { id: 1, name: "All" },
        { id: 2, name: "Teach" },
        { id: 3, name: "Learn" },
    ];

    const [selected, setSelected] = useState(type[0]);
    const [data, setData] = useState([]);
    const [inpVal, setInpVal] = useState("");
    const [inpVal2, setInpVal2] = useState("");
    const [loading, setLoading] = useState(true);
    const [loggedin, setLoggedIn] = useState(false);
    const [activeFilters, setActiveFilters] = useState([]);
    const [matches, setMatches] = useState([]);
    const [currentUserUid, setCurrentUserUid] = useState(null);
    const [ratingsMap, setRatingsMap] = useState({}); // For leaderboard

    // Get current logged-in user
    const toShowFilter = () => {
        onAuthStateChanged(auth, (user) => {
            setLoggedIn(!!user);
            if (user) setCurrentUserUid(user.uid);
        });
    };

    const syncActiveFilters = (status, skill, author) => {
        const newFilters = [];
        if (status !== "All") newFilters.push({ label: status, type: "status" });
        if (skill.trim() !== "") newFilters.push({ label: skill, type: "skill" });
        if (author.trim() !== "") newFilters.push({ label: author, type: "author" });
        setActiveFilters(newFilters);
    };

    const getFilteredData = async () => {
        setLoading(true);
        try {
            const filters = [];
            const skillsRef = collection(db, "Skills");

            if (selected.name !== "All") {
                filters.push(where("status", "==", selected.name));
            }

            if (inpVal.trim() !== "") {
                filters.push(where("skill_lower", "==", inpVal.toLowerCase()));
            }

            let q;
            if (inpVal2.trim() !== "") {
                q = query(
                    skillsRef,
                    ...filters,
                    orderBy("author_lower"),
                    startAt(inpVal2.toLowerCase()),
                    endAt(inpVal2.toLowerCase() + "\uf8ff")
                );
            } else {
                q = query(skillsRef, ...filters);
            }

            const querySnapshot = await getDocs(q);
            const dataArr = [];
            querySnapshot.forEach((doc) => {
                dataArr.push({ id: doc.id, ...doc.data() });
            });

            // Fetch ratings and compute average
            const ratingsSnapshot = await getDocs(collection(db, "Ratings"));
            const ratingObj = {};
            ratingsSnapshot.forEach(doc => {
                const { teacherUid, rating } = doc.data();
                if (!ratingObj[teacherUid]) ratingObj[teacherUid] = [];
                ratingObj[teacherUid].push(rating);
            });
            const avgRatings = {};
            for (const key in ratingObj) {
                const arr = ratingObj[key];
                avgRatings[key] = arr.reduce((a,b) => a+b, 0) / arr.length;
            }
            setRatingsMap(avgRatings);

            // Sort teachers by rating descending
            dataArr.sort((a,b) => {
                const rA = avgRatings[a.uid] || 0;
                const rB = avgRatings[b.uid] || 0;
                return rB - rA;
            });

            setData(dataArr);

            // Also compute matches (Teach ↔ Learn)
            if (currentUserUid) {
                const userSkills = dataArr.filter(skill => skill.uid === currentUserUid);
                const matchedSkills = [];

                userSkills.forEach(userSkill => {
                    dataArr.forEach(skill => {
                        if (
                            skill.uid !== currentUserUid &&
                            userSkill.skill.toLowerCase() === skill.skill.toLowerCase() &&
                            ((userSkill.status === "Teach" && skill.status === "Learn") ||
                                (userSkill.status === "Learn" && skill.status === "Teach"))
                        ) {
                            matchedSkills.push(skill);
                        }
                    });
                });

                setMatches(matchedSkills);
            }

        } catch (error) {
            console.error("Filtering failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        syncActiveFilters(selected.name, inpVal, inpVal2);
        if (!loading) getFilteredData();
    }, [selected]);

    useEffect(() => {
        toShowFilter();
        getFilteredData();
        document.title = "SkillSwap | Teach what you know. Learn what you want.";
    }, [currentUserUid]);

    const handleClearAll = () => {
        setSelected(type[0]);
        setInpVal("");
        setInpVal2("");
    };

    if (loading) {
        return (
            <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 flex flex-col gap-6">
            {loggedin && (
                <>
                    <div className="flex flex-col items-end gap-2 justify-start w-full sm:flex-row sm:items-start sm:gap-4">
                        <input
                            type="text"
                            value={inpVal2}
                            onChange={(e) => setInpVal2(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    syncActiveFilters(selected.name, inpVal, inpVal2);
                                    getFilteredData();
                                }
                            }}
                            className="w-full border border-gray-300 outline-none py-1.5 px-2 text-left text-gray-900 rounded-md"
                            placeholder="Search by Author Name"
                        />
                        <input
                            type="text"
                            value={inpVal}
                            onChange={(e) => setInpVal(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    syncActiveFilters(selected.name, inpVal, inpVal2);
                                    getFilteredData();
                                }
                            }}
                            className="w-full border border-gray-300 outline-none py-1.5 px-2 text-left text-gray-900 rounded-md"
                            placeholder="Search by Skill Name"
                        />
                        <Listbox value={selected} onChange={setSelected}>
                            <div className="relative w-full sm:w-50">
                                <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 border border-gray-300 focus:outline-none sm:text-sm">
                                    <span className="col-start-1 row-start-1 flex items-center gap-3 pr-6">
                                        <span className="block truncate">{selected.name}</span>
                                    </span>
                                    <ChevronDownIcon
                                        aria-hidden="true"
                                        className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                                    />
                                </ListboxButton>
                                <ListboxOptions className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                    {type.map((elem) => (
                                        <ListboxOption
                                            key={elem.id}
                                            value={elem}
                                            className="group relative cursor-pointer py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white"
                                        >
                                            <div className="flex items-center">
                                                <span className="pl-2 block truncate font-normal group-data-selected:font-semibold">
                                                    {elem.name}
                                                </span>
                                            </div>
                                        </ListboxOption>
                                    ))}
                                </ListboxOptions>
                            </div>
                        </Listbox>
                    </div>

                    {/* Filter Tags */}
                    {activeFilters.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 border-b-1 border-gray-200 pb-6">
                            {activeFilters.map((filter, index) => (
                                <button
                                    key={index}
                                    className="bg-transparent text-indigo-600 px-2 gap-2 py-1 rounded flex justify-between items-center outline-1 outline-indigo-600"
                                >
                                    {filter.label}
                                </button>
                            ))}
                            <button
                                onClick={handleClearAll}
                                className="ml-auto bg-indigo-600 text-white px-2 gap-1 py-1 rounded flex justify-between items-center outline-1 outline-indigo-600 cursor-pointer hover:bg-indigo-500"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Matched Skills Section */}
            {matches.length > 0 && (
                <div className="p-4 border border-green-400 rounded-md mb-6">
                    <h2 className="text-lg font-semibold text-green-600 mb-2">
                        Your Skill Matches
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        {matches.map((match) => (
                            <div
                                key={match.id}
                                className="w-full border border-gray-200 px-4 py-3 rounded-lg sm:w-auto sm:min-w-60"
                            >
                                <Link to={`/seeprofile/${match.uid}`}>
                                    <h1 className="text-indigo-600 text-sm mb-2">{match.author}</h1>
                                </Link>
                                <div className="flex w-full justify-between items-center mb-3 gap-5">
                                    <h1 className="text-xl font-semibold">{match.skill}</h1>
                                    <button
                                        className={`text-white px-2.5 py-0.5 rounded text-sm ${
                                            match.status === "Teach"
                                                ? "bg-green-400"
                                                : "bg-yellow-400"
                                        }`}
                                    >
                                        {match.status}
                                    </button>
                                </div>
                                <Link
                                    to={`/course/${match.id}`}
                                    className="hover:bg-indigo-500 bg-indigo-600 text-white px-2 py-1 rounded text-sm cursor-pointer"
                                >
                                    View Details
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Leaderboard Section */}
{Object.keys(ratingsMap).length > 0 && (
    <div className="p-4 border border-indigo-400 rounded-md mb-6">
        <h2 className="text-lg font-semibold text-indigo-600 mb-2">
            Teacher Leaderboard
        </h2>
        <div className="flex flex-wrap gap-4">
            {data
                .filter(teacher => ratingsMap[teacher.uid]) // only with rating
                .slice(0, 5) // top 5
                .map((teacher) => (
                    <div
                        key={teacher.id}
                        className="w-full border border-gray-200 px-4 py-3 rounded-lg sm:w-auto sm:min-w-60"
                    >
                        <Link to={`/seeprofile/${teacher.uid}`}>
                            <h1 className="text-indigo-600 text-sm mb-1">{teacher.author}</h1>
                        </Link>
                        <div className="flex items-center gap-1 mb-2">
                            {[1,2,3,4,5].map(star => (
                                <span key={star} className={`text-sm ${star <= (ratingsMap[teacher.uid] || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    ★
                                </span>
                            ))}
                            <span className="text-xs text-gray-600 ml-1">{(ratingsMap[teacher.uid] || 0).toFixed(1)}</span>
                        </div>
                        <div className="flex w-full justify-between items-center mb-3 gap-5">
                            <h1 className="text-xl font-semibold">{teacher.skill}</h1>
                            <button
                                className={`text-white px-2.5 py-0.5 rounded text-sm ${
                                    teacher.status === "Teach"
                                        ? "bg-green-400"
                                        : "bg-yellow-400"
                                }`}
                            >
                                {teacher.status}
                            </button>
                        </div>
                        <Link
                            to={`/course/${teacher.id}`}
                            className="hover:bg-indigo-500 bg-indigo-600 text-white px-2 py-1 rounded text-sm cursor-pointer"
                        >
                            View Details
                        </Link>
                    </div>
                ))}
        </div>
    </div>
)}
                  



            {/* Existing Data Section */}
            <div className="flex flex-wrap justify-start items-start gap-5">
                {data.map((elem, idx) => (
                    <div
                        key={idx}
                        className="w-full border border-gray-200 px-4 py-3 rounded-lg sm:w-auto sm:min-w-60"
                    >
                        <Link to={`/seeprofile/${elem.uid}`}>
                            <h1 className="text-indigo-600 text-sm mb-1">{elem.author}</h1>
                        </Link>
                        {/* Display average rating */}
                        <div className="flex items-center gap-1 mb-2">
                            {[1,2,3,4,5].map(star => (
                                <span key={star} className={`text-sm ${star <= (ratingsMap[elem.uid] || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    ★
                                </span>
                            ))}
                            <span className="text-xs text-gray-600 ml-1">{(ratingsMap[elem.uid] || 0).toFixed(1)}</span>
                        </div>
                        <div className="flex w-full justify-between items-center mb-3 gap-5">
                            <h1 className="text-xl font-semibold">{elem.skill}</h1>
                            <button
                                className={`text-white px-2.5 py-0.5 rounded text-sm ${
                                    elem.status === "Teach"
                                        ? "bg-green-400"
                                        : "bg-yellow-400"
                                }`}
                            >
                                {elem.status}
                            </button>
                        </div>

                        <Link
                            to={`/course/${elem.id}`}
                            className="hover:bg-indigo-500 bg-indigo-600 text-white px-2 py-1 rounded text-sm cursor-pointer"
                        >
                            View Details
                        </Link>
                    </div>
                ))}
                 </div>

                 <div className="p-6 bg-gray-50">
  <h2 className="text-2xl font-bold text-center mb-6">What Students Say</h2>
  <div className="flex flex-wrap justify-center gap-6">
    {[
      {name: "Nagalakshmi", skill: "Python", feedback: "This platform made learning fun!", img: "public/naga1.jpg"},
      {name: "Lakshmi", skill: "React", feedback: "I quickly found a mentor!", img: "public/la.jpg"},
      {name: "Nageshwari", skill: "Graphic Design", feedback: "Amazing platform for learning and teaching!", img: "public/naga.jpg"},
      {name: "Divya", skill: "Data Analysis", feedback: "I improved my skills so fast!", img:"public/di.jpg"},
    ].map((t, i) => (
      <div
        key={i}
        className="w-72 p-4 border rounded-lg bg-white shadow-lg hover:scale-105 transition-transform duration-300"
      >
        <img src={t.img} alt={t.name} className="w-16 h-16 rounded-full mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-center">{t.name}</h3>
        <p className="text-sm text-center text-indigo-600 mb-2">{t.skill}</p>
        <p className="text-gray-700 text-center">{t.feedback}</p>
      </div>
    ))}
  </div>
</div>

                 {/* Student FAQ Section */}
<div className="p-6 border-t mt-6">
  <h2 className="text-2xl font-bold mb-6 text-indigo-600">Student FAQs</h2>
  <div className="space-y-4">
    {[
      { q: "How do I register as a student?", a: "Click the 'Sign Up' button, fill in your details, and verify your email." },
      { q: "How can I find teachers?", a: "Use the search bar or browse the 'Skill Matches' section to find teachers for your desired skills." },
      { q: "Can I learn multiple skills at once?", a: "Yes! Add all the skills you want to learn and check for matching teachers." },
      { q: "How do I track my learning progress?", a: "Currently, you can track skills you've added and see which teachers you matched with." },
      { q: "Can I cancel a learning session?", a: "If a session is scheduled, you can contact the teacher directly to cancel or reschedule." },
      { q: "Is my profile visible to all users?", a: "Yes, your skill list is visible but personal info like email is hidden." },
      { q: "Can I suggest a new skill to be added?", a: "Yes! Click 'Add Skill' and fill in the skill details you want to learn or teach." },
    ].map((faq, index) => (
      <details
        key={index}
        className="group border rounded-md p-4 bg-white shadow-md transition-all duration-300 hover:shadow-xl"
      >
        <summary className="cursor-pointer font-semibold text-indigo-600 group-open:text-indigo-800">
          {faq.q}
        </summary>
        <p className="mt-2 text-gray-700 animate-slideDown">{faq.a}</p>
      </details>
    ))}
  </div>
</div>




            {/* About Us Section */}
<div className="mt-10 p-6 bg-indigo-50 rounded-xl shadow-md text-center">
  <h2 className="text-2xl font-bold text-indigo-900 mb-3">About Us</h2>
  <p className="text-indigo-800 text-base max-w-2xl mx-auto">
    SkillSwap is a platform where learners and teachers connect. Share your skills,
    learn new ones, and build a community of knowledge. Whether you want to teach or learn,
    SkillSwap makes it simple and rewarding.
  </p>
</div>
        </div>
        
    );
};


export default Home;



