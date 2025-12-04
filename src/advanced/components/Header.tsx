import React from "react";
import { Button } from "./Button";

interface HeaderRootProps {
  children: React.ReactNode;
}

interface AdminToggleProps {
  isAdmin: boolean;
  onToggle: () => void;
}

// Header.Root - 전체 레이아웃
const HeaderRoot = ({ children }: HeaderRootProps) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">{children}</div>
      </div>
    </header>
  );
};

// Header.Logo
const HeaderLogo = () => {
  return <h1 className="text-xl font-semibold text-gray-800">SHOP</h1>;
};

// Header.Left - 왼쪽 영역 (로고 + 검색창)
const HeaderLeft = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex items-center flex-1">{children}</div>;
};

// Header.Right - 오른쪽 영역 (관리자 토글 + 장바구니)
const HeaderRight = ({ children }: { children: React.ReactNode }) => {
  return <nav className="flex items-center space-x-4">{children}</nav>;
};

// Header.AdminToggle - 관리자 토글 버튼 (Header 내부 소유)
const HeaderAdminToggle = ({ isAdmin, onToggle }: AdminToggleProps) => {
  return (
    <Button onClick={onToggle} reverse={!isAdmin} size="sm">
      {isAdmin ? "쇼핑몰로 돌아가기" : "관리자 페이지로"}
    </Button>
  );
};

// Compound Component Export
export const Header = {
  Root: HeaderRoot,
  Logo: HeaderLogo,
  Left: HeaderLeft,
  Right: HeaderRight,
  AdminToggle: HeaderAdminToggle,
};
