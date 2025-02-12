import React, { useRef, useEffect, useState } from 'react';
import paper_ from 'paper';
import './componentsStyle.css'

const DrawingTool = ({ setDrawControl, peerConnections }) => {
    const [color, setColor] = useState("#ff0066")
    const canvasRef = useRef(null)
    const canvasWrapperRef = useRef(null)

    let paper = new paper_.PaperScope

    let versionList = []
    let versionIndex = 0

    function getAllPaths(json) {
        let paths = [];
      
        // Loop through the structure recursively to find paths
        JSON.parse(json).forEach(item => {
          if (item[0] === "Layer" && item[1].children) {
            item[1].children.forEach(child => {
              if (child[0] === "Path") {
                // Extract the path object (second element of the array)
                const pathData = child[1]
                if (pathData && pathData.segments && pathData.strokeColor) {
                  paths.push(pathData) // Add the path to the result array
                }
              }
            })
          }
        })
      
        return paths
    }

    const echoPeers = (message) => {
        console.log(peerConnections.current)
        for (let i = 0; i < peerConnections.current.peers.length; i++) {
            console.log(peerConnections.current)
            peerConnections.current.peers[i].getDataChannel().send(message) // Echo
        }
    }

    const echoPath = (path) => {
        if (peerConnections) {
            echoPeers(JSON.stringify({"answer": "addPath", "content": JSON.stringify(paper.project.exportJSON())}))
        }
    }

    const echoRemovePath = (path) => {
        if (peerConnections) {
            echoPeers(JSON.stringify({"answer": "removePath", "content": JSON.stringify(path)}))
        }
    }

    useEffect(() => {
        let connections = []

        let path
        let paths = []

        let selectedTool = "none"
        const tool = new paper.Tool(); // Create a new Tool instance
        tool.minDistance = 10; // Set tool properties
        tool.maxDistance = 45; // Set tool properties

        paper.setup(canvasRef.current);
        paper.view.viewSize = new paper.Size(canvasWrapperRef.current.clientWidth, canvasWrapperRef.current.clientHeight)
        console.log(canvasWrapperRef.clientWidth, canvasWrapperRef.clientHeight)
        paper.project.currentStyle = new paper.Color('black')

        versionList.push(paper.project.exportJSON()) // Default project safe for code logic

        // Canvas version control functions //

        function getAllPathsFromAllItems() {
            let paths_ = [];
        
            // Loop through all items in the project
            paper.project.getItems().forEach(item => {
                paths_.push(...item.children)
            });
        
            return paths_
        }

        const updateVersionList = () => {
            if (versionIndex !== versionList.length - 1) {
                console.log("splicing")
                versionList = versionList.splice(0, versionIndex + 1)
            }
    
            versionIndex = versionList.length // Most recent version is always at the end of versionList
            versionList.push(paper.project.exportJSON())
        }

        const back = () => {
            versionIndex -= Number(versionIndex !== 0)
    
            paper.project.clear() // Clear the current project
            paper.project.importJSON(versionList[versionIndex]) // Restore the cached version
            paths = getAllPathsFromAllItems()
        }

        const foward = () => {
            versionIndex += Number(versionIndex !== versionList.length - 1)
    
            paper.project.clear() // Clear the current project
            paper.project.importJSON(versionList[versionIndex]) // Restore the cached version
            paths = getAllPathsFromAllItems()
        }

        const addPath = (path) => {
            paths.push(path)
            console.log(path)
            paper.importJSON(path)
            updateVersionList()
        }

        const removePath = (path) => {
            console.log("removing:", path[1])
            let index = -1
            console.log(path, path)

            for (let i = 0; i < paths.length; i++) {
                if (JSON.stringify(paths[i]) == JSON.stringify(path)) {
                    index = i
                }
            }

            if (index !== -1) {
                paths[index].remove()
                updateVersionList()
            }
        }

        const replaceCanvas = (canvasJSON) => {
            paper.importJSON(canvasJSON)
            updateVersionList()
            paths = getAllPathsFromAllItems()
        }

        // Pencil //
        function pencilBegin(event) {
            console.log(document.querySelector(".color-picker").style.backgroundColor)
            path = new paper.Path()
            path.strokeColor = new paper.Color(document.querySelector(".color-picker").style.backgroundColor)
            path.add(event.point)
            paths.push(path)
        }

        function pencilDrag(event) {
            if (path) {
                path.add(event.point)
                path.smooth()
            }
        }

        function pencilEnd(event) {
            if (path) {
                path.add(event.point)
                path.smooth()
                echoPath(path)
            }
        }

        // Earser //

        let pathBuffer = []

        function earseDrag(event) {
            let eraser = new paper.Path.Circle({
                center: event.point,
                radius: 20 // Eraser size
            })
        
            let intersection = false

            // Loop through all paths and check for intersection with the eraser
            paths.forEach(existingPath => {
                if (eraser.intersects(existingPath)) {
                    pathBuffer.push(existingPath)
                    existingPath.remove() // Remove the path if it intersects the eraser
                    intersection = true
                }
            })

            eraser.remove()
            updateVersionList()
        }

        function earseEnd() {
            pathBuffer.forEach(path => {
                echoRemovePath(path)
            })
        }
        // Bucket //

        function bucketFill(event) {
            let hitResult = paper.project.hitTest(event.point, {
                fill: true,  // Detect filled areas
                stroke: true, // Detect strokes
                tolerance: 10  // Adjust click tolerance
            });
        
            if (hitResult && hitResult.item) {
                hitResult.item.fillColor = new paper.Color(document.querySelector(".color-picker").style.backgroundColor);
                updateVersionList()
                echoPath("path")
            }
        }

        // Other Tool Funcs //
        
        function buttonToDefault(toolName) {
            let button = canvasWrapperRef.current.querySelector(`.${toolName}-tool`)

            button.classList.remove("active")
        }

        function buttonToActive(toolName) {
            let button = canvasWrapperRef.current.querySelector(`.${toolName}-tool`)

            button.classList.add("active")
        }

        function changeTool(toolName) {
            if (selectedTool !== "none") {
                console.log(toolName)
                buttonToDefault(selectedTool)
            }
            if (toolName === selectedTool) {
                console.log(toolName === selectedTool)
                selectedTool = "none"
                tool.onMouseDown = () => {}
                tool.onMouseDrag = () => {}
                tool.onMouseUp = () => {}
                return
            }

            selectedTool = toolName
            buttonToActive(toolName)

            switch(toolName) {
                case "pencil":
                    tool.onMouseDown = pencilBegin
                    tool.onMouseDrag = pencilDrag
                    tool.onMouseUp = pencilEnd
                    break
                case "earser":
                    tool.onMouseDown = () => {}
                    tool.onMouseDrag = earseDrag
                    tool.onMouseUp = earseEnd
                    break
                case "bucket":
                    tool.onMouseDown = bucketFill
                    tool.onMouseDrag = () => {}
                    tool.onMouseUp = () => {}
                    break
                default:
                    break
            }
        }

        // Hookup tool changes to button //

        canvasWrapperRef.current.querySelector(".drawing-tools").querySelectorAll("button").forEach(element => {
            if (!element.className.includes("-tool")) {
                return //incase of the classname being formated wrongly
            }
            
            //the classname of the tool already contains the goto tool
            const handleClick = () => {
                changeTool(element.className.replaceAll("-tool", "").replaceAll(" active", ""))
            };
    
            element.addEventListener("click", handleClick)
            connections.push(() => {element.removeEventListener("click", handleClick)})
        });

        canvasWrapperRef.current.querySelector(".back-button-canvas").addEventListener("click", back)
        canvasWrapperRef.current.querySelector(".foward-button-canvas").addEventListener("click", foward)

        
        if (setDrawControl) { // Sending scope back up
            setDrawControl({
                paper,
                addPath,
                removePath,
                replaceCanvas
        })
            console.log("paper scope sent correctly")
        }

        return () => {
            for (let connection of connections) {
                connection()
            }
            paper.clear()
            paper.remove()
        }
    }, []);

    useEffect(() => {
        canvasWrapperRef.current.querySelector(".top-button-wrapper-wrapper").style.width = `${canvasWrapperRef.current.clientWidth + 50}px`
    }, [])

    return (
        <div className='canvas-wrapper' ref={canvasWrapperRef}>
            <div className='top-button-wrapper-wrapper'>
                <div className='top-button-wrapper'>
                    <div className='nav-button'>
                        <button className='back-button-canvas' style={{ rotate: '180deg' }} />
                    </div>
                    <div className='nav-button-shadow'></div>
                </div>
                <div className='top-button-wrapper'>
                    <div className='nav-button'>
                        <button className='foward-button-canvas'/>
                    </div>
                    <div className='nav-button-shadow'></div>
                </div>
            </div>
            <canvas className='draw-canvas' ref={canvasRef}/>
            <div className='drawing-tools'>
                <button className='pencil-tool'>
                    <div className='pencil' />
                    <div className='pencil-shadow'/>
                </button>
                <button className='earser-tool'>
                    <div className='earser' />
                    <div className='earser-shadow'/>
                </button>
                <button className='bucket-tool'>
                    <div className='bucket' />
                    <div className='bucket-shadow'/>
                </button>
                <div className='color-picker-wrapper'>
                    <div className="color-picker" style={{ backgroundColor: color }}>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                        />
                    </div>
                    <div className='color-picker-shadow'></div>
                </div>
            </div>
        </div>
    );
};

export default DrawingTool;
