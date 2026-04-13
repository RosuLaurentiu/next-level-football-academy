import Home from "./Home";
import Login from "./Login";
import { useAppState } from "./appState";

export default function Index() {
  const { player } = useAppState();

  return player ? <Home /> : <Login />;
}
