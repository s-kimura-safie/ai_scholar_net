import React from 'react'
import Topbar from "../../components/topbar/Topbar"
import Sidebar from "../../components/sidebar/Sidebar"
import Timeline from "../../components/timeline/Timeline"
import Rightbar from "../../components/rightbar/Rightbar"
import "./Home.css"

export default function Home() {
    return (
        <>
            <Topbar />
            <div className="homeContainer">
                <Sidebar />
                <Timeline />
                <Rightbar />
            </div>
        </>
    )
}
