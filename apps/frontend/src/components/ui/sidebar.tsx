"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  ChevronsLeft,
  MenuIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

//================================ ZT COMPONENTS ================================//

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

//================================ ZT CONTEXT =================================//

interface SidebarContextProps {
  state: "expanded" | "collapsed"
  isMobile: boolean
  open: boolean
  setOpen: (value: boolean | ((value: boolean) => boolean)) => void
  openMobile: boolean
  setOpenMobile: (value: boolean | ((value: boolean) => boolean)) => void
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

//================================ ZT PROVIDER ================================//

interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (value: boolean) => void
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  children,
  ...props
}: SidebarProviderProps) {
  // We use this to force a re-render when the screen size changes.
  const [isMobile, setIsMobile] = React.useState(false)
  const [_open, _setOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the controlled state.
  const open = openProp ?? _open

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value

      if (onOpenChange) {
        onOpenChange(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [onOpenChange, open]
  )

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev)
    } else {
      setOpen((prev) => !prev)
    }
  }, [isMobile, setOpen])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleSidebar()
      }
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("resize", handleResize)
    }
  }, [toggleSidebar])

  const state = open ? "expanded" : "collapsed"

  const value = {
    state,
    isMobile,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    toggleSidebar,
  }

  return (
    <SidebarContext.Provider value={value}>
      <div {...props}>{children}</div>
    </SidebarContext.Provider>
  )
}

//================================ ZT SIDEBAR =================================//

const sidebarVariants = cva(
  "fixed top-0 z-40 h-screen transition-transform duration-300 ease-in-out",
  {
    variants: {
      side: {
        left: "-translate-x-full border-r rtl:translate-x-full rtl:border-l rtl:border-r-0",
        right:
          "translate-x-full border-l rtl:-translate-x-full rtl:border-r rtl:border-l-0",
      },
      variant: {
        sidebar: "bg-sidebar text-sidebar-foreground",
        floating:
          "m-4 h-[calc(100vh-2rem)] rounded-lg border bg-sidebar text-sidebar-foreground",
        inset: "bg-sidebar text-sidebar-foreground",
      },
    },
    defaultVariants: {
      side: "left",
      variant: "sidebar",
    },
  }
)

interface Sidebar
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  collapsible?: "icon" | "offcanvas" | "none"
}

const Sidebar = React.forwardRef<HTMLDivElement, Sidebar>(
  (
    {
      className,
      side = "left",
      variant = "sidebar",
      collapsible = "icon",
      ...props
    },
    ref
  ) => {
    const { open, openMobile } = useSidebar()

    return (
      <aside
        ref={ref}
        className={cn(
          "peer/sidebar",
          (collapsible === "icon" || collapsible === "offcanvas") &&
            "data-[state=expanded]:peer/expanded",
          collapsible === "icon" &&
            "group/sidebar data-[state=collapsed]:w-16",
          collapsible === "offcanvas" && "data-[state=collapsed]:hidden",
          variant === "sidebar" && "data-[state=expanded]:w-[--sidebar-width]",
          variant === "sidebar" &&
            "data-[state=collapsed]:w-[--sidebar-width-collapsed]",
          variant === "floating" && "data-[state=expanded]:w-[--sidebar-width]",
          variant === "floating" &&
            "data-[state=collapsed]:w-[--sidebar-width-collapsed]",
          variant === "inset" && "data-[state=expanded]:w-[--sidebar-width]",
          variant === "inset" &&
            "data-[state=collapsed]:w-[--sidebar-width-collapsed]",
          open && "translate-x-0 rtl:-translate-x-0",
          openMobile && "translate-x-0 rtl:-translate-x-0",
          sidebarVariants({ side, variant, className })
        )}
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-collapsed": "4rem",
            "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
          } as React.CSSProperties
        }
        data-collapsible={collapsible}
        data-state={open ? "expanded" : "collapsed"}
        {...props}
      />
    )
  }
)
Sidebar.displayName = "Sidebar"

//============================== ZT SIDEBAR INSET ===============================//

interface SidebarInset extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarInset = React.forwardRef<HTMLDivElement, SidebarInset>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "transition-spacing duration-300 ease-in-out peer-data-[state=expanded]/sidebar:ml-[--sidebar-width] peer-data-[state=expanded]/sidebar:rtl:mr-[--sidebar-width]",
          className
        )}
        {...props}
      />
    )
  }
)
SidebarInset.displayName = "SidebarInset"

//================================ ZT TRIGGER =================================//

const SidebarTrigger = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const { isMobile, toggleSidebar } = useSidebar()

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(
          !isMobile &&
            "peer/trigger peer-data-[state=expanded]/sidebar:hidden",
          isMobile && "hidden",
          className
        )}
        {...props}
      >
        <MenuIcon />
      </Button>
    )
  }
)
SidebarTrigger.displayName = "SidebarTrigger"

//================================ ZT HEADER ==================================//

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("sticky top-0 z-10 border-b", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

//================================ ZT CONTENT =================================//

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("h-full overflow-y-auto", className)}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

//================================ ZT FOOTER ==================================//

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("sticky bottom-0 z-10 border-t", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

//============================ ZT SIDEBAR SEPARATOR ============================//

const SidebarSeparator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => {
  return (
    <hr
      ref={ref}
      className={cn("border-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

//================================ ZT GROUP ===================================//

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("p-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

//================================ ZT GROUP LABEL ===============================//

interface SidebarGroupLabel
  extends React.HTMLAttributes<HTMLHeadingElement> {}

const SidebarGroupLabel = React.forwardRef<
  HTMLHeadingElement,
  SidebarGroupLabel
>(({ className, ...props }, ref) => {
  const { open } = useSidebar()
  return (
    <h2
      ref={ref}
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-opacity group-data-[state=collapsed]/sidebar:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

//============================== ZT GROUP CONTENT =============================//

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("pt-1", className)}
      {...props}
    />
  )
})
SidebarGroupContent.displayName = "SidebarGroupContent"

//================================ ZT GROUP ACTION ================================//

interface SidebarGroupAction
  extends React.HTMLAttributes<HTMLButtonElement> {}

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  SidebarGroupAction
>(({ className, ...props }, ref) => {
  const { open } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "absolute right-2 top-1.5 size-7 transition-opacity group-data-[state=collapsed]/sidebar:opacity-0",
        className
      )}
      data-state={open ? "expanded" : "collapsed"}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

//================================ ZT MENU ====================================//

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col", className)}
      {...props}
    />
  )
})
SidebarMenu.displayName = "SidebarMenu"

//================================ ZT MENU ITEM =================================//

interface SidebarMenuItem extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarMenuItem = React.forwardRef<HTMLDivElement, SidebarMenuItem>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative flex", className)}
        {...props}
      />
    )
  }
)
SidebarMenuItem.displayName = "SidebarMenuItem"

//================================ ZT MENU BUTTON ===============================//

interface SidebarMenuButton extends ButtonProps {
  isActive?: boolean
}

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButton
>(({ className, isActive, ...props }, ref) => {
  const { open } = useSidebar()
  return (
    <Button
      ref={ref}
      variant="ghost"
      data-active={isActive}
      className={cn(
        "peer/menu-button flex h-9 justify-start gap-3 rounded-md px-3 text-sm transition-colors",
        "data-[active=true]:bg-primary/10 data-[active=true]:text-primary",
        "group-data-[state=collapsed]/sidebar:size-9 group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0",
        className
      )}
      data-state={open ? "expanded" : "collapsed"}
      {...props}
    />
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

//================================ ZT MENU ICON =================================//

interface SidebarMenuIcon extends React.HTMLAttributes<HTMLSpanElement> {
  icon: LucideIcon
}

const SidebarMenuIcon = React.forwardRef<HTMLSpanElement, SidebarMenuIcon>(
  ({ className, icon: Icon, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        <Icon className="size-4" />
      </span>
    )
  }
)
SidebarMenuIcon.displayName = "SidebarMenuIcon"

//================================ ZT MENU LABEL ================================//

const SidebarMenuLabel = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "truncate transition-opacity group-data-[state=collapsed]/sidebar:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuLabel.displayName = "SidebarMenuLabel"

//================================ ZT MENU ACTION ===============================//

interface SidebarMenuAction extends ButtonProps {}

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuAction
>(({ className, ...props }, ref) => {
  const { open } = useSidebar()
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "invisible absolute right-1 top-1/2 size-7 -translate-y-1/2 group-hover/menu-item:visible peer-data-[active=true]/menu-button:visible",
        "transition-opacity group-data-[state=collapsed]/sidebar:opacity-0",
        className
      )}
      data-state={open ? "expanded" : "collapsed"}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

//================================ ZT MENU SUB ==================================//

const SidebarMenuSub = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "ml-6 border-l pl-3 transition-opacity group-data-[state=collapsed]/sidebar:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSub.displayName = "SidebarMenuSub"

//================================ ZT MENU SUB ITEM ===============================//

const SidebarMenuSubItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("", className)}
      {...props}
    />
  )
})
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

//================================ ZT MENU SUB BUTTON =============================//

interface SidebarMenuSubButton extends ButtonProps {
  isActive?: boolean
}

const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuSubButton
>(({ className, isActive, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      data-active={isActive}
      className={cn(
        "h-8 justify-start gap-3 rounded-md px-3 text-sm",
        "data-[active=true]:bg-primary/10 data-[active=true]:text-primary",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

//================================ ZT MENU BADGE ================================//

const SidebarMenuBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuBadge.displayName = "SidebarMenuBadge"

//================================ ZT MENU SKELETON =============================//

interface SidebarMenuSkeleton extends React.HTMLAttributes<HTMLDivElement> {
  showIcon?: boolean
}

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  SidebarMenuSkeleton
>(({ className, showIcon = true, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-3", className)}
      {...props}
    >
      {showIcon && <div className="size-4 shrink-0 rounded-sm bg-muted/70" />}
      <div className="h-4 w-full rounded-sm bg-muted/70" />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

//================================ ZT RAIL ====================================//

const SidebarRail = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open, toggleSidebar } = useSidebar()
  return (
    <div
      ref={ref}
      className={cn(
        "absolute -right-2 top-1/2 -translate-y-1/2",
        "z-10 hidden",
        "peer-data-[collapsible=icon]/sidebar:block",
        className
      )}
      {...props}
    >
      <Button
        variant="outline"
        size="icon"
        className="size-7 rounded-full"
        onClick={toggleSidebar}
      >
        {open ? (
          <ChevronsLeft className="size-4" />
        ) : (
          <ChevronsLeft className="size-4 rotate-180" />
        )}
      </Button>
    </div>
  )
})
SidebarRail.displayName = "SidebarRail"

//============================== ZT MOBILE TRIGGER ==============================//

const SidebarMobileTrigger = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar()

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn("md:hidden", className)}
        {...props}
      >
        <MenuIcon />
      </Button>
    )
  }
)
SidebarMobileTrigger.displayName = "SidebarMobileTrigger"

//================================ ZT MOBILE SHEET ================================//

interface SidebarSheet extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarSheet = React.forwardRef<HTMLDivElement, SidebarSheet>(
  ({ className, ...props }, ref) => {
    const { isMobile, openMobile, setOpenMobile } = useSidebar()

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-40 bg-black/50",
          (isMobile && openMobile) || "hidden",
          className
        )}
        onClick={() => setOpenMobile(false)}
        {...props}
      />
    )
  }
)
SidebarSheet.displayName = "SidebarSheet"

//============================ ZT MOBILE SHEET CLOSE ============================//

interface SidebarSheetClose extends React.HTMLAttributes<HTMLButtonElement> {}

const SidebarSheetClose = React.forwardRef<
  HTMLButtonElement,
  SidebarSheetClose
>(({ className, ...props }, ref) => {
  const { setOpenMobile } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "absolute right-4 top-4 z-50 rounded-full opacity-70",
        "ring-offset-background transition-opacity hover:opacity-100",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:pointer-events-none",
        className
      )}
      onClick={() => setOpenMobile(false)}
      {...props}
    >
      <XIcon className="size-5" />
      <span className="sr-only">Close</span>
    </Button>
  )
})
SidebarSheetClose.displayName = "SidebarSheetClose"

export {
  // Main
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  // Components
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  // Group
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarGroupAction,
  // Menu
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuIcon,
  SidebarMenuLabel,
  SidebarMenuAction,
  SidebarMenuBadge,
  // Sub Menu
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  // Skeleton
  SidebarMenuSkeleton,
  // Mobile
  SidebarRail,
  SidebarMobileTrigger,
  SidebarSheet,
  SidebarSheetClose,
} 