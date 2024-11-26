import { Link, Route, Routes } from "react-router-dom";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ModeToggle } from "@/components/mode-toggle";

//import CropContainer from "./components/containers/crop-container";
import CanvasLayout from "./components/containers/canvas-container";
import CropContainer from "./components/containers/crop-container";


export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden">
      <Dialog>
        <Menubar className="px-8">
          <MenubarMenu>
            <MenubarTrigger>Aplicacion</MenubarTrigger>
            <MenubarContent>
              <Link to="/">
                <MenubarItem>Canvas</MenubarItem>
              </Link>
            <Link to="/crop">
              <MenubarItem>Crop</MenubarItem>
            </Link>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>About</MenubarTrigger>
            <MenubarContent>
              <DialogTrigger asChild>
                <MenubarItem>
                  <span>Acerca</span>
                </MenubarItem>
              </DialogTrigger>
            </MenubarContent>
          </MenubarMenu>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tienda De Calcos v1.0</DialogTitle>
              <DialogHeader>Posicionador de Sticker automatizado</DialogHeader>
              <div className="py-4">
                <iframe
                  width="460"
                  height="315"
                  src=
                    "https://www.youtube.com/embed/dQw4w9WgXcQ?si=hpWYmGbonknV71ts&autoplay=1"
                
                  title="YouTube video player"
                  allow="autoplay"
                ></iframe>
              </div>
            </DialogHeader>
          </DialogContent>
          <div className="w-full flex justify-end">
            <ModeToggle />
          </div>
        </Menubar>
      </Dialog>
      <Routes>
        <Route path="/" element={<CanvasLayout />} />
        <Route path="/crop" element={<CropContainer />} />
      </Routes>
    </div>
  );
}
