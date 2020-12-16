import React from "react";

const Header = () => (
  <div className="site_header">
    <div className="sm_section">
      <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="" />
      <h1 className="title">PlaylistMessage</h1>
    </div>
  </div>
);

export default Header;
