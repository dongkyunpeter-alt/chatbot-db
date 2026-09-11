import { useState } from "react";
import Button from "./Button";
const Card = () => {
  const [on, setOn] = useState(false);
  return (
    <>
      <h1 onClick={() => setOn((prev) => !prev)}>{on ? "🌝" : "🌚"}</h1>
      {console.log(on)}
      {on && <Button text="Click" />}
      <div style={{ color: on && "red" }}>Card</div>
    </>
  );
};
export default Card;
