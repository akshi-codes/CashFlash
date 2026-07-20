import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { store } from "./store/store";
import AuthBootstrapper from "./features/auth/state/authBootstrapper";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <AuthBootstrapper>
        <App />
      </AuthBootstrapper>
    </Provider>
  </BrowserRouter>,
);
