import { Link, Route, Routes } from "react-router-dom";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { ModeToggle } from "@/components/mode-toggle";

import CropContainer from "./components/containers/crop-container";
import CanvasLayout from "./components/containers/canvas-container";
import Clean from "./clean";

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <Menubar className="px-8">
        <MenubarMenu>
          <MenubarTrigger>Aplicacion</MenubarTrigger>
          <MenubarContent>
            <Link to="/canvas">
              <MenubarItem>Canvas</MenubarItem>
            </Link>
            <MenubarSeparator />
            <Link to="/crop">
              <MenubarItem>Crop</MenubarItem>
            </Link>
            <Link to="/clean">
              <MenubarItem>clean</MenubarItem>
            </Link>
          </MenubarContent>
        </MenubarMenu>
        <div className="w-full flex justify-end">
          <ModeToggle />
        </div>
      </Menubar>
      <Routes>
        <Route path="/canvas" element={<CanvasLayout />} />
        <Route path="/crop" element={<CropContainer />} />
        <Route path="/clean" element={<Clean />} />
      </Routes>
    </div>
  );
}
