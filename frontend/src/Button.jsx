import "./Button.css";
const Button = ({ text, color }) => {
  const cla = color === undefined ? "" : color;
  const heart = text === "Login" ? text + "❤" : text;
  return (
    <>
      <div className={`btn ${cla}`}>{`${heart}`}</div>
      {text === "Login" && <div>{} 환영합니다</div>}
      {text === "회원가입" && <div>{text} 후 이용가능</div>}
    </>
  );
};
export default Button;
