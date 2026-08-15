"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheckIcon,
  BookOpenIcon,
  ChevronsUpDownIcon,
  CircleHelpIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareIcon,
  MoonIcon,
  PanelTopIcon,
  SearchIcon,
  Settings2Icon,
  SunIcon,
  MailBadgeIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
};

const NAV_ITEMS = [
  { href: "/home", label: "Overview", icon: LayoutDashboardIcon },
] as const;

const PAGE_ITEMS = [
  { href: "/showcases", label: "Showcases", icon: PanelTopIcon },
  { label: "Submissions", href: "/submissions", icon: FileTextIcon },
  { label: "Invitations", href: "/invitations", icon: MailBadgeIcon },
  { label: "Friends", href: "/friends", icon: UsersRoundIcon },
] as const;

const UTILITY_ITEMS = [
  { label: "Documentation", href: "/documentation", icon: BookOpenIcon },
  { label: "Settings", href: "/settings", icon: Settings2Icon },
] as const;

function AppShellNavItem({ href, label, icon: Icon, isActive }: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  function handleClick() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link href={href} aria-current={isActive ? "page" : undefined} onClick={handleClick}>
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function WorkspaceHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm">
      <SidebarTrigger />
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="hidden justify-start text-muted-foreground sm:flex sm:w-64 lg:w-80"
        aria-label="Search workspace"
      >
        <SearchIcon className="size-4" />
        <span>Search</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium lg:inline">Ctrl K</kbd>
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label="Help"
        >
          <CircleHelpIcon className="size-4" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function AppShell({ children, userName, userEmail }: AppShellProps) {
  const pathname = usePathname();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const displayName = userName || "OpenAux User";
  const displayEmail = userEmail || "Signed in";
  const avatarFallback = displayName.slice(0, 2).toUpperCase();
  const activeTheme = theme === "system" ? resolvedTheme : theme;

  function onToggleTheme() {
    if (!activeTheme) {
      return;
    }

    setTheme(activeTheme === "dark" ? "light" : "dark");
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" tooltip="OpenAux workspace">
                <Link href="/home" aria-label="OpenAux workspace">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <PanelTopIcon className="size-4" />
                  </div>
                  <div className="flex h-8 flex-1 items-center text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">OPENAUX</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <AppShellNavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={pathname === item.href}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Pages</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {PAGE_ITEMS.map((item) => (
                  <AppShellNavItem
                    key={item.label}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={pathname === item.href}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Support</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {UTILITY_ITEMS.map((item) => (
                  <AppShellNavItem
                    key={item.label}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={pathname === item.href}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-1!" tooltip="Account">
                    <Avatar className="size-7 rounded-full group-data-[collapsible=icon]:size-8">
                      <AvatarImage alt={displayName} />
                      <AvatarFallback className="rounded-full bg-sidebar-foreground text-sidebar">{avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-xs">{displayEmail}</span>
                    </div>
                    <ChevronsUpDownIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side="top" align="end" sideOffset={4}>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage alt={displayName} />
                        <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{displayName}</span>
                        <span className="truncate text-xs">{displayEmail}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <BadgeCheckIcon className="h-4 w-4" />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquareIcon className="h-4 w-4" />
                      Feedback
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onToggleTheme}>
                      {mounted && activeTheme === "dark" ? (
                        <SunIcon className="h-4 w-4" />
                      ) : (
                        <MoonIcon className="h-4 w-4" />
                      )}
                      {mounted && activeTheme === "dark" ? "Light mode" : "Dark mode"}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/auth/logout">
                      <LogOutIcon className="h-4 w-4" />
                      Log out
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-screen bg-background">
        <WorkspaceHeader />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
