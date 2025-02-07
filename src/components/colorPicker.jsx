import { useState } from "react"
import './componentsStyle.css'

const colorPicker = () => {
  const [color, setColor] = useState("#ffffff")

  return (
    <div className="color-picker">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
    </div>
  )
}

export default colorPicker