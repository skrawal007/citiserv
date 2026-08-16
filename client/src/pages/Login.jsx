import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const initialvalue = { username: "", pass: "" };
  const [formData, setFormData] = useState(initialvalue);
  const [showpass, setShowpass] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // If already logged in, navigate directly to dashboard
  useEffect(() => {
    const hasToken = sessionStorage.getItem("authToken");
    if (isAuthenticated || hasToken) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleTogglePass = () => {
    setShowpass(!showpass);
  };

  const handleFormValue = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value.replace(/\s+/g, ""),
    });
    if (errorMsg) setErrorMsg("");
  };

  const userlogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await login(formData.username, formData.pass);
      if (result.success) {
        setFormData(initialvalue);
        navigate("/dashboard", { replace: true });
      } else {
        setErrorMsg(result.message || "Invalid Username or Password!");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "CCTNS AGRA / Login";
  }, []);

  return (
    <div className="login-standalone-page">
      <div className="login-card-container">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-header-logos">
              <img src="/img/UPPOLICE_LOGO.png" alt="UP POLICE LOGO" className="login-logo-img" />
              <img src="/img/agra-logo.png" alt="AGRA POLICE LOGO" className="login-logo-img" />
            </div>
            <h2>CCTNS AGRA</h2>
            <p className="login-subtitle">WEST ZONE, AGRA POLICE PORTAL</p>
            <div className="login-badge-tag">🔐 SYSTEM LOGIN</div>
          </div>

          {errorMsg && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '8px',
              margin: '12px 0 0 0',
              fontSize: '13px',
              fontWeight: '500',
              textAlign: 'center',
              border: '1px solid #fecaca'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form className="login-form" onSubmit={userlogin}>
            <div className="form-group">
              <label htmlFor="username">Username / यूजर आईडी</label>
              <div className="input-with-icon">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  placeholder="username"
                  name="username"
                  value={formData.username}
                  onChange={handleFormValue}
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pass">Password / पासवर्ड</label>
              <div className="input-with-icon password-input-wrapper">
                <span className="input-icon">🔑</span>
                <input
                  type={showpass ? "password" : "text"}
                  placeholder="password"
                  name="pass"
                  value={formData.pass}
                  onChange={handleFormValue}
                  required
                  autoComplete="off"
                />
                <span className="password-eye-icon toggle-password-btn" onClick={handleTogglePass}>
                  {showpass ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </span>
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* <div className="login-dummy-notice">
            <div className="dummy-title">ℹ️ Demo / Testing Credentials:</div>
            <div className="dummy-credentials">
              <span>Username: <strong>1234</strong></span>
              <span>Password: <strong>1234</strong></span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
