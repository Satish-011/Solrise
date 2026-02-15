"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import Navbar from "./Navbar";

const NavbarWrapper: React.FC = () => {
  const { handle, loadingUser, setHandleAndFetch, clearUser } = useAppContext();

  return (
    <Navbar
      handle={handle ?? undefined}
      onHandleSubmit={setHandleAndFetch}
      onHandleClear={clearUser}
      userLoading={loadingUser}
    />
  );
};

export default NavbarWrapper;
