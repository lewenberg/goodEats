import { appApi } from "@/api/AppApi";
import { AuthUser, useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUiStore } from "@/stores/uiStore";
import { MenuItem, Order, Restaurant, User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  Image,
  Menu,
  Minus,
  Pencil,
  Plus,
  ReceiptText,
  Save,
  Search,
  Shield,
  SlidersHorizontal,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  Trash2,
  UtensilsCrossed,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type CartLine = { item: MenuItem; quantity: number };
type OrderDraft = Record<string, CartLine>;
type AppSection = "browse" | "cart" | "orders" | "restaurants" | "menu" | "edit" | "users";

const EMPTY_RESTAURANTS: Restaurant[] = [];
const EMPTY_ORDERS: Order[] = [];
const EMPTY_USERS: User[] = [];

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);

const blankRestaurant = (): Partial<Restaurant> => ({
  restaurantName: "",
  city: "New York",
  country: "USA",
  ownerId: null,
  deliveryPrice: 299,
  estimatedDeliveryTime: 30,
  cuisines: ["American"],
  imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop",
  menuItems: [{ _id: `item-${Date.now()}`, name: "Signature Plate", price: 1299, description: "House favorite" }],
  isActive: true,
});

const roleConfig = {
  admin: { icon: Shield, label: "Full system control", color: "bg-slate-950 text-white" },
  owner: { icon: Store, label: "Menu and order control", color: "bg-emerald-700 text-white" },
  customer: { icon: UserRound, label: "Browse and order", color: "bg-amber-500 text-slate-950" },
};

const menuItemSchema = z.object({
  _id: z.string().min(1),
  name: z.string().trim().min(2, "Menu item names need at least 2 characters"),
  description: z.string().trim().optional(),
  price: z.coerce.number().int().positive("Menu item prices must be greater than 0"),
});

const restaurantFormSchema = z.object({
  _id: z.string().optional(),
  restaurantName: z.string().trim().min(2, "Restaurant name needs at least 2 characters"),
  city: z.string().trim().min(2, "City is required"),
  country: z.string().trim().min(2, "Country is required"),
  ownerId: z.string().nullable().optional(),
  deliveryPrice: z.coerce.number().int().nonnegative("Delivery price cannot be negative"),
  estimatedDeliveryTime: z.coerce.number().int().positive("ETA must be greater than 0"),
  cuisines: z.array(z.string().trim().min(1)).min(1, "Add at least one cuisine"),
  imageUrl: z.string().trim().url("Image must be a valid URL"),
  menuItems: z.array(menuItemSchema).min(1, "Add at least one menu item"),
  isActive: z.boolean().optional(),
});

const appQueryKeys = {
  restaurants: (token: string) => ["app", "restaurants", token] as const,
  orders: (token: string) => ["app", "orders", token] as const,
  users: (token: string, role?: string) => ["app", "users", token, role] as const,
};

const HomePage = () => {
  const { user, accounts, loginAs, getAccessToken } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [cart, setCart] = useState<OrderDraft>({});
  const [query, setQuery] = useState("");
  const [restaurantForm, setRestaurantForm] = useState<Partial<Restaurant>>(blankRestaurant());
  const [activeSection, setActiveSection] = useState<AppSection>("browse");
  const isMenuOpen = useUiStore((state) => state.isMenuOpen);
  const setMenuOpen = useUiStore((state) => state.setMenuOpen);
  const toggleMenu = useUiStore((state) => state.toggleMenu);
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [expandedRestaurantId, setExpandedRestaurantId] = useState<string>("");

  const token = getAccessToken();
  const restaurantsQuery = useQuery({
    queryKey: appQueryKeys.restaurants(token),
    queryFn: () => appApi.getRestaurants(token),
    enabled: Boolean(token),
  });
  const ordersQuery = useQuery({
    queryKey: appQueryKeys.orders(token),
    queryFn: () => appApi.getOrders(token),
    enabled: Boolean(token),
  });
  const usersQuery = useQuery({
    queryKey: appQueryKeys.users(token, user?.role),
    queryFn: () => appApi.getUsers(token),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const restaurants = restaurantsQuery.data ?? EMPTY_RESTAURANTS;
  const orders = ordersQuery.data ?? EMPTY_ORDERS;
  const users = usersQuery.data ?? EMPTY_USERS;
  const selectedRestaurant = restaurants.find((restaurant) => restaurant._id === selectedRestaurantId);
  const cartLines = Object.values(cart);
  const subtotal = cartLines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const delivery = selectedRestaurant ? selectedRestaurant.deliveryPrice : 0;
  const total = subtotal + delivery;

  const ownerOptions = accounts.filter((account) => account.role === "owner");
  const visibleRestaurants = useMemo(() => {
    const search = query.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      if (!restaurant.isActive && user?.role === "customer") return false;
      if (!search) return true;
      return [restaurant.restaurantName, restaurant.city, ...restaurant.cuisines]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [query, restaurants, user?.role]);

  const refreshAppData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["app", "restaurants"] }),
      queryClient.invalidateQueries({ queryKey: ["app", "orders"] }),
      queryClient.invalidateQueries({ queryKey: ["app", "users"] }),
    ]);
  };

  const saveRestaurantMutation = useMutation({
    mutationFn: (payload: z.infer<typeof restaurantFormSchema>) => {
      if (payload._id) return appApi.updateRestaurant(token, payload._id, payload);
      return appApi.createRestaurant(token, payload);
    },
    onSuccess: async (_, payload) => {
      toast.success(payload._id ? "Restaurant updated" : "Restaurant created");
      setRestaurantForm(blankRestaurant());
      setIsRestaurantModalOpen(false);
      await refreshAppData();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: (id: string) => appApi.deleteRestaurant(token, id),
    onSuccess: async () => {
      toast.success("Restaurant removed");
      await refreshAppData();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const createOrderMutation = useMutation({
    mutationFn: () => {
      if (!user || !selectedRestaurant) throw new Error("Select a restaurant before ordering");
      return appApi.createOrder(token, {
        restaurantId: selectedRestaurant._id,
        items: cartLines.map((line) => ({ menuItemId: line.item._id, quantity: line.quantity })),
        deliveryName: user.name,
        deliveryAddress: "Saved demo address",
      });
    },
    onSuccess: async (order) => {
      setCart({});
      toast.success(`Order ${order.orderId} placed`);
      await refreshAppData();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      appApi.updateOrderStatus(token, orderId, status),
    onSuccess: async () => {
      toast.success("Order status updated");
      await refreshAppData();
    },
    onError: (error) => toast.error((error as Error).message),
  });

  useEffect(() => {
    if (!selectedRestaurantId && visibleRestaurants[0]) {
      setSelectedRestaurantId(visibleRestaurants[0]._id);
    }
  }, [selectedRestaurantId, visibleRestaurants]);

  useEffect(() => {
    if (user?.role === "owner" && restaurants[0] && !restaurantForm._id) {
      setRestaurantForm({ ...restaurants[0] });
    }
  }, [restaurantForm._id, restaurants, user?.role]);

  useEffect(() => {
    if (!user) return;
    const allowedSections: Record<typeof user.role, AppSection[]> = {
      admin: ["restaurants", "orders", "users"],
      owner: ["restaurants", "orders", "menu", "edit"],
      customer: ["browse", "cart", "orders"],
    };
    const defaults: Record<typeof user.role, AppSection> = {
      admin: "restaurants",
      owner: "restaurants",
      customer: "browse",
    };

    if (!allowedSections[user.role].includes(activeSection)) {
      setActiveSection(defaults[user.role]);
    }
  }, [activeSection, user]);

  const editRestaurant = (restaurant: Restaurant) => {
    setRestaurantForm({ ...restaurant });
    setSelectedRestaurantId(restaurant._id);
    setExpandedRestaurantId(restaurant._id);
    setIsRestaurantModalOpen(true);
  };

  const addMenuItem = () => {
    setRestaurantForm((current) => ({
      ...current,
      menuItems: [
        ...(current.menuItems || []),
        { _id: `item-${Date.now()}`, name: "New menu item", price: 1099, description: "Freshly added" },
      ],
    }));
  };

  const updateMenuItem = (index: number, patch: Partial<MenuItem>) => {
    setRestaurantForm((current) => ({
      ...current,
      menuItems: (current.menuItems || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  };

  const removeMenuItem = (index: number) => {
    setRestaurantForm((current) => ({
      ...current,
      menuItems: (current.menuItems || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const saveRestaurant = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    const parsed = restaurantFormSchema.safeParse({
      ...restaurantForm,
      cuisines: (restaurantForm.cuisines || []).map((cuisine) => cuisine.trim()).filter(Boolean),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the restaurant form");
      return;
    }

    saveRestaurantMutation.mutate(parsed.data);
  };

  const deleteRestaurant = async (id: string) => {
    if (!token) return;
    deleteRestaurantMutation.mutate(id);
  };

  const addToCart = (item: MenuItem) => {
    setCart((current) => ({
      ...current,
      [item._id]: { item, quantity: (current[item._id]?.quantity || 0) + 1 },
    }));
  };

  const changeQuantity = (itemId: string, delta: number) => {
    setCart((current) => {
      const line = current[itemId];
      if (!line) return current;
      const quantity = line.quantity + delta;
      if (quantity <= 0) {
        const rest = { ...current };
        delete rest[itemId];
        return rest;
      }
      return { ...current, [itemId]: { ...line, quantity } };
    });
  };

  const placeOrder = async () => {
    if (!user || !token || !selectedRestaurant) return;
    createOrderMutation.mutate();
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  if (!user) {
    return <LoginPage accounts={accounts} onLogin={loginAs} />;
  }

  return (
    <div className={`grid items-start gap-5 transition-[grid-template-columns] duration-300 ease-out ${isMenuOpen ? "lg:grid-cols-[300px_minmax(0,1fr)]" : "lg:grid-cols-[0_minmax(0,1fr)]"}`}>
      <AppMenuDrawer
        user={user}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isOpen={isMenuOpen}
        setIsOpen={setMenuOpen}
        toggleMenu={toggleMenu}
        counts={{
          restaurants: restaurants.length,
          orders: orders.length,
          users: users.length,
          cart: cartLines.length,
          menu: restaurantForm.menuItems?.length || 0,
        }}
      />
      <div className="min-w-0">
        {user.role === "customer" ? (
          <CustomerExperience
            activeSection={activeSection}
            restaurants={visibleRestaurants}
            selectedRestaurant={selectedRestaurant}
            selectedRestaurantId={selectedRestaurantId}
            setSelectedRestaurantId={(id) => {
              setSelectedRestaurantId(id);
              setCart({});
            }}
            query={query}
            setQuery={setQuery}
            cartLines={cartLines}
            subtotal={subtotal}
            delivery={delivery}
            total={total}
            addToCart={addToCart}
            changeQuantity={changeQuantity}
            placeOrder={placeOrder}
            orders={orders}
          />
        ) : (
          <ManagementExperience
            role={user.role}
            activeSection={activeSection}
            restaurants={restaurants}
            users={users}
            ownerOptions={ownerOptions}
            restaurantForm={restaurantForm}
            setRestaurantForm={setRestaurantForm}
            saveRestaurant={saveRestaurant}
            isSaving={saveRestaurantMutation.isPending}
            editRestaurant={editRestaurant}
            deleteRestaurant={deleteRestaurant}
            addMenuItem={addMenuItem}
            updateMenuItem={updateMenuItem}
            removeMenuItem={removeMenuItem}
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            isRestaurantModalOpen={isRestaurantModalOpen}
            setIsRestaurantModalOpen={setIsRestaurantModalOpen}
            expandedRestaurantId={expandedRestaurantId}
            setExpandedRestaurantId={setExpandedRestaurantId}
          />
        )}
      </div>
    </div>
  );
};

const LoginPage = ({ accounts, onLogin }: { accounts: AuthUser[]; onLogin: (userId: string) => void }) => {
  const loginOptions = (["admin", "owner", "customer"] as const)
    .map((role) => accounts.find((account) => account.role === role))
    .filter(Boolean) as AuthUser[];

  return (
  <div className="mx-auto flex min-h-[72vh] w-full max-w-4xl items-center justify-center">
    <section className="restaurant-panel grid w-full overflow-hidden rounded-xl bg-card md:grid-cols-[0.78fr_1.22fr]">
      <div className="flex min-h-[360px] items-center justify-center bg-[#17201e] p-6 text-amber-50 sm:p-8">
        <div>
          <p className="text-xs font-black uppercase text-[#f6c54e]">GoodEats access</p>
          <h1 className="font-display mt-3 text-5xl font-black leading-none sm:text-6xl">Login</h1>
        </div>
      </div>

      <div className="flex min-h-[420px] flex-col">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <p className="text-xs font-black uppercase text-slate-500">Sign in</p>
          <p className="font-display text-xl font-black text-slate-950">Select a demo role</p>
        </div>

        <div className="flex flex-1 flex-col justify-center p-4 sm:p-6">
          <div className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
            {loginOptions.map((account) => {
              const config = roleConfig[account.role];
              const Icon = config.icon;

              return (
                <button
                  key={account.userId}
                  type="button"
                  onClick={() => onLogin(account.userId)}
                  className="group grid w-full grid-cols-[auto_1fr] items-center gap-4 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:ring-offset-2 sm:grid-cols-[auto_1fr_auto]"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-black text-slate-950">{account.name}</span>
                    <span className="block truncate text-sm font-medium text-slate-500">{account.email}</span>
                  </span>
                  <span className="hidden items-center gap-3 text-xs font-black uppercase text-slate-500 sm:flex">
                    <span className="rounded-full border border-slate-950 bg-card px-2 py-1 text-slate-950">{account.role}</span>
                    <ChevronRight className="h-4 w-4 text-slate-950" />
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="mt-5 flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left font-black text-slate-700 transition hover:bg-white"
            onClick={() => toast.info("Manual account entry is a placeholder in this demo.")}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <UserRound className="h-5 w-5" />
            </span>
            Use another account
          </button>
        </div>
      </div>
    </section>
  </div>
  );
};

const AppMenuDrawer = ({
  user,
  activeSection,
  setActiveSection,
  isOpen,
  setIsOpen,
  toggleMenu,
  counts,
}: {
  user: AuthUser;
  activeSection: AppSection;
  setActiveSection: (section: AppSection) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleMenu: () => void;
  counts: { restaurants: number; orders: number; users: number; cart: number; menu: number };
}) => {
  const itemsByRole: Record<AuthUser["role"], { id: AppSection; label: string; icon: typeof Store; count?: number }[]> = {
    admin: [
      { id: "restaurants", label: "Restaurants", icon: Store, count: counts.restaurants },
      { id: "orders", label: "Orders", icon: ClipboardList, count: counts.orders },
      { id: "users", label: "Users", icon: UserRound, count: counts.users },
    ],
    owner: [
      { id: "restaurants", label: "Restaurants", icon: Store, count: counts.restaurants },
      { id: "orders", label: "Orders", icon: ClipboardList, count: counts.orders },
      { id: "menu", label: "Menu items", icon: ReceiptText, count: counts.menu },
      { id: "edit", label: "Edit restaurant", icon: Shield },
    ],
    customer: [
      { id: "browse", label: "Browse food", icon: Store, count: counts.restaurants },
      { id: "cart", label: "Cart", icon: ShoppingBag, count: counts.cart },
      { id: "orders", label: "Orders", icon: ClipboardList, count: counts.orders },
    ],
  };

  return (
    <div className={`${isOpen ? "w-full opacity-100" : "w-0 opacity-100"} transition-[width] duration-300`}>
      <Button
        type="button"
        variant="outline"
        onClick={toggleMenu}
        className={`fixed left-4 top-20 z-40 h-11 rounded-full border-slate-300 bg-white px-4 font-black shadow-sm hover:bg-amber-50 ${isOpen ? "lg:hidden" : ""}`}
      >
        <Menu className="h-5 w-5" />
        Menu
      </Button>
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,320px)] flex-col overflow-hidden border border-[#263531] bg-[#101c19] p-5 text-amber-50 shadow-2xl transition-all duration-300 lg:sticky lg:top-20 lg:z-20 lg:max-h-[calc(100vh-6rem)] lg:min-h-[calc(100vh-8rem)] lg:w-auto lg:rounded-xl lg:shadow-sm ${
          isOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-full opacity-0 lg:-translate-x-6"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-[#f6c54e]">{user.role}</p>
            <h2 className="font-display mt-1 text-4xl font-black leading-none">{user.name}</h2>
          </div>
          <Button type="button" size="icon" variant="ghost" className="rounded-full text-amber-50 hover:bg-amber-50/10 hover:text-amber-50" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-8 grid gap-2">
          {itemsByRole[user.role].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                }}
                className={`flex items-center justify-between rounded-lg px-4 py-3 text-left font-black transition ${
                  isActive ? "bg-[#f6c54e] text-slate-950" : "text-amber-50/80 hover:bg-amber-50/10 hover:text-amber-50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {item.label}
                </span>
                {typeof item.count === "number" ? <span className="text-xs opacity-70">{item.count}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-lg border border-amber-50/10 bg-amber-50/5 p-3">
          <p className="text-xs font-black uppercase text-[#f6c54e]">Sticky menu</p>
          <p className="mt-1 text-sm font-semibold text-amber-50/70">Open or closed, the page layout keeps its shape instead of covering your work.</p>
        </div>
      </aside>
    </div>
  );
};

const CustomerExperience = ({
  activeSection,
  restaurants,
  selectedRestaurant,
  selectedRestaurantId,
  setSelectedRestaurantId,
  query,
  setQuery,
  cartLines,
  subtotal,
  delivery,
  total,
  addToCart,
  changeQuantity,
  placeOrder,
  orders,
}: {
  activeSection: AppSection;
  restaurants: Restaurant[];
  selectedRestaurant?: Restaurant;
  selectedRestaurantId: string;
  setSelectedRestaurantId: (id: string) => void;
  query: string;
  setQuery: (value: string) => void;
  cartLines: CartLine[];
  subtotal: number;
  delivery: number;
  total: number;
  addToCart: (item: MenuItem) => void;
  changeQuantity: (itemId: string, delta: number) => void;
  placeOrder: () => void;
  orders: Order[];
}) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const itemCount = cartLines.reduce((count, line) => count + line.quantity, 0);

  const cartPanel = (
    <div className="restaurant-panel-soft rounded-[1.25rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase text-[#f05d3b]">Current order</p>
          <h2 className="font-display flex items-center gap-2 text-3xl font-black leading-none">
            <ShoppingBag className="h-5 w-5 text-[#f05d3b]" />
            Cart
          </h2>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-slate-900">{itemCount} items</span>
      </div>
      <div className="mt-4 max-h-[42vh] space-y-3 overflow-y-auto pr-1">
        {cartLines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm font-bold text-slate-500">
            Select a menu item to start an order.
          </div>
        ) : (
          cartLines.map((line) => (
            <div key={line.item._id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <div className="min-w-0">
                <p className="truncate font-bold">{line.item.name}</p>
                <p className="text-sm text-slate-500">{money(line.item.price * line.quantity)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2 border-slate-950" onClick={() => changeQuantity(line.item._id, -1)}><Minus className="h-3.5 w-3.5" /></Button>
                <span className="w-6 text-center font-bold">{line.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-2 border-slate-950" onClick={() => changeQuantity(line.item._id, 1)}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-5 space-y-2 border-t-2 border-slate-950 pt-4 text-sm">
        <PriceRow label="Subtotal" value={subtotal} />
        <PriceRow label="Delivery" value={cartLines.length ? delivery : 0} />
        <PriceRow label="Total" value={cartLines.length ? total : 0} strong />
      </div>
      <Button disabled={cartLines.length === 0} onClick={placeOrder} className="mt-4 h-12 w-full rounded-full border-2 border-slate-950 bg-[#f05d3b] font-black text-white shadow-[3px_3px_0_#17201e] hover:bg-[#d94f32]">
        <CheckCircle2 className="h-4 w-4" />
        Place order
      </Button>
    </div>
  );

  const cartPopout = (
    <>
      {isCartOpen ? (
        <button
          type="button"
          aria-label="Close cart"
          className="fixed inset-0 z-30 cursor-default bg-transparent"
          onClick={() => setIsCartOpen(false)}
        />
      ) : null}
      <div className="fixed right-3 top-[4.6rem] z-40 sm:right-40 sm:top-3 lg:right-48">
        <Button
          type="button"
          aria-expanded={isCartOpen}
          aria-controls="customer-cart-popout"
          onClick={() => setIsCartOpen((open) => !open)}
          className="group h-11 rounded-full border-2 border-slate-950 bg-[#17201e] px-3 font-black text-amber-50 shadow-[3px_3px_0_#f05d3b] hover:bg-emerald-900 sm:h-10"
        >
          <span className="relative grid h-6 w-6 place-items-center rounded-full bg-amber-50 text-slate-950">
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 ? (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full border border-slate-950 bg-[#f6c54e] px-1 text-[10px] leading-none text-slate-950">
                {itemCount}
              </span>
            ) : null}
          </span>
          <span className="hidden sm:inline">{cartLines.length ? money(total) : "Cart"}</span>
        </Button>
        {isCartOpen ? (
          <div
            id="customer-cart-popout"
            className="absolute right-0 mt-3 w-[min(92vw,390px)] origin-top-right animate-in fade-in-0 zoom-in-95"
          >
            {cartPanel}
          </div>
        ) : null}
      </div>
    </>
  );

  if (activeSection === "cart") {
    return (
      <>
        {cartPopout}
        <div className="mx-auto max-w-xl">{cartPanel}</div>
      </>
    );
  }

  if (activeSection === "orders") {
    return (
      <>
        {cartPopout}
        <OrderList orders={orders} />
      </>
    );
  }

  return (
  <>
  {cartPopout}
  <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
    <aside className="restaurant-panel-soft h-fit rounded-[1.5rem] p-4 lg:sticky lg:top-24">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="ink-pill"><Sparkles className="h-3.5 w-3.5" />Eat</span>
        <span className="text-xs font-black uppercase text-slate-500">{restaurants.length} open</span>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 rounded-full border-2 border-slate-950 bg-white pl-11 font-bold" placeholder="Search restaurants" />
      </div>
      <div className="scrollbar-thin mt-4 flex gap-3 overflow-x-auto pb-2 lg:max-h-[58vh] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">
        {restaurants.map((restaurant) => (
          <button
            key={restaurant._id}
            onClick={() => setSelectedRestaurantId(restaurant._id)}
            className={`min-w-[230px] rounded-[1.25rem] border-2 p-3 text-left transition lg:min-w-0 ${
              selectedRestaurantId === restaurant._id ? "border-slate-950 bg-[#f6c54e] shadow-[4px_4px_0_#17201e]" : "border-slate-950 bg-white hover:bg-amber-50"
            }`}
          >
            <span className="font-display block text-xl font-black leading-tight">{restaurant.restaurantName}</span>
            <span className="mt-1 block truncate text-sm font-semibold text-slate-600">{restaurant.city} / {restaurant.cuisines.join(", ")}</span>
          </button>
        ))}
      </div>
    </aside>

    <section className="space-y-5">
      {selectedRestaurant ? (
        <>
          <div className="restaurant-panel overflow-hidden rounded-[2rem] bg-card">
            <div className="relative">
              <img src={selectedRestaurant.imageUrl} className="h-[280px] w-full object-cover sm:h-[380px] lg:h-[460px]" alt={selectedRestaurant.restaurantName} />
              <div className="absolute inset-x-4 bottom-4 rounded-[1.5rem] border-2 border-slate-950 bg-card/95 p-4 shadow-[5px_5px_0_#17201e] backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-[#f05d3b]">Now serving</p>
                    <h2 className="font-display text-4xl font-black leading-none sm:text-6xl">{selectedRestaurant.restaurantName}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm font-black text-slate-900">
                    <span className="rounded-full border-2 border-slate-950 bg-white px-3 py-2"><Clock className="mr-1 inline h-4 w-4 text-emerald-800" />{selectedRestaurant.estimatedDeliveryTime} min</span>
                    <span className="rounded-full border-2 border-slate-950 bg-[#f6c54e] px-3 py-2"><BadgeDollarSign className="mr-1 inline h-4 w-4" />{money(selectedRestaurant.deliveryPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {selectedRestaurant.menuItems.map((item) => (
              <div key={item._id} className="restaurant-panel-soft grid gap-4 rounded-[1.5rem] p-4">
                <div>
                  <h3 className="font-display text-2xl font-black leading-tight">{item.name}</h3>
                  <p className="mt-1 min-h-10 text-sm font-semibold text-slate-500">{item.description}</p>
                  <p className="mt-3 text-lg font-black text-emerald-900">{money(item.price)}</p>
                </div>
                <Button onClick={() => addToCart(item)} className="h-11 rounded-full border-2 border-slate-950 bg-[#17201e] text-amber-50 shadow-[3px_3px_0_#f05d3b] hover:bg-emerald-900"><Plus className="h-4 w-4" />Add</Button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="No restaurant selected" />
      )}
    </section>

  </div>
  </>
  );
};

const ManagementExperience = ({
  role,
  activeSection,
  restaurants,
  users,
  ownerOptions,
  restaurantForm,
  setRestaurantForm,
  saveRestaurant,
  isSaving,
  editRestaurant,
  deleteRestaurant,
  addMenuItem,
  updateMenuItem,
  removeMenuItem,
  orders,
  updateOrderStatus,
  isRestaurantModalOpen,
  setIsRestaurantModalOpen,
  expandedRestaurantId,
  setExpandedRestaurantId,
}: {
  role: "admin" | "owner";
  activeSection: AppSection;
  restaurants: Restaurant[];
  users: User[];
  ownerOptions: AuthUser[];
  restaurantForm: Partial<Restaurant>;
  setRestaurantForm: React.Dispatch<React.SetStateAction<Partial<Restaurant>>>;
  saveRestaurant: (event: FormEvent) => void;
  isSaving: boolean;
  editRestaurant: (restaurant: Restaurant) => void;
  deleteRestaurant: (id: string) => void;
  addMenuItem: () => void;
  updateMenuItem: (index: number, patch: Partial<MenuItem>) => void;
  removeMenuItem: (index: number) => void;
  orders: Order[];
  updateOrderStatus: (orderId: string, status: string) => void;
  isRestaurantModalOpen: boolean;
  setIsRestaurantModalOpen: (open: boolean) => void;
  expandedRestaurantId: string;
  setExpandedRestaurantId: (id: string) => void;
}) => {
  const restaurantCards = (
    <div className="grid gap-3">
      {restaurants.map((restaurant) => (
        <div key={restaurant._id} className="restaurant-panel-soft overflow-hidden rounded-xl bg-white">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setExpandedRestaurantId(expandedRestaurantId === restaurant._id ? "" : restaurant._id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setExpandedRestaurantId(expandedRestaurantId === restaurant._id ? "" : restaurant._id);
              }
            }}
            className="grid w-full gap-4 p-3 text-left transition hover:bg-amber-50/60 md:grid-cols-[180px_minmax(0,1fr)_auto]"
          >
            <img src={restaurant.imageUrl} className="h-36 w-full rounded-lg object-cover md:h-32" alt={restaurant.restaurantName} />
            <div className="min-w-0 self-center">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-3xl font-black leading-none">{restaurant.restaurantName}</h3>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${restaurant.isActive ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-600"}`}>
                  {restaurant.isActive ? "Active" : "Paused"}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-500">{restaurant.city} / {restaurant.cuisines.join(", ")}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase text-slate-600">
                <span className="rounded-full bg-amber-100 px-2 py-1">{restaurant.menuItems.length} items</span>
                <span className="rounded-full bg-slate-100 px-2 py-1">{orders.filter((order) => order.restaurantId === restaurant._id).length} orders</span>
                <span className="rounded-full bg-slate-100 px-2 py-1">{restaurant.ownerId || "admin-owned"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-center">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-slate-300 bg-white font-bold"
                onClick={(event) => {
                  event.stopPropagation();
                  editRestaurant(restaurant);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              {role === "admin" ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="h-10 rounded-full font-bold"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteRestaurant(restaurant._id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
              <ChevronDown className={`h-5 w-5 transition ${expandedRestaurantId === restaurant._id ? "rotate-180" : ""}`} />
            </div>
          </div>
          {expandedRestaurantId === restaurant._id ? (
            <div className="grid gap-3 border-t border-slate-200 bg-[#fbf6ea] p-4 lg:grid-cols-2">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-black uppercase text-slate-600"><UtensilsCrossed className="h-4 w-4" />Items</h4>
                <div className="mt-2 grid gap-2">
                  {restaurant.menuItems.map((item) => (
                    <div key={item._id} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                      <div className="flex justify-between gap-3">
                        <p className="font-black">{item.name}</p>
                        <p className="font-black text-emerald-900">{money(item.price)}</p>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{item.description || "No description yet"}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="flex items-center gap-2 text-sm font-black uppercase text-slate-600"><ReceiptText className="h-4 w-4" />Orders</h4>
                <div className="mt-2 grid gap-2">
                  {orders.filter((order) => order.restaurantId === restaurant._id).length ? (
                    orders.filter((order) => order.restaurantId === restaurant._id).map((order) => (
                      <div key={order._id} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                        <div className="flex justify-between gap-3">
                          <p className="font-black">{order.customerName}</p>
                          <p className="font-black">{money(order.total)}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-500">{order.orderId} / {order.status}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm font-bold text-slate-500">No orders for this restaurant yet.</div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );

  const usersPanel = (
    <div className="restaurant-panel-soft rounded-lg p-4">
      <h2 className="font-display text-3xl font-black">Users</h2>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {users.map((managedUser) => (
          <div key={managedUser.userId} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
            <p className="font-bold">{managedUser.name}</p>
            <p className="text-sm text-slate-500">{managedUser.email} / {managedUser.role}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (role === "admin") {
    return (
        <section className="space-y-4">
          {activeSection === "restaurants" ? (
            <div className="restaurant-panel-soft flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-[#f05d3b]">Admin restaurants</p>
                <h1 className="font-display text-4xl font-black leading-none">Expandable restaurant board</h1>
              </div>
              <Button
                type="button"
                className="h-11 rounded-full bg-[#17201e] px-5 font-black text-amber-50 hover:bg-emerald-900"
                onClick={() => {
                  setRestaurantForm(blankRestaurant());
                  setIsRestaurantModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Restaurant
              </Button>
            </div>
          ) : null}
          {activeSection === "restaurants" ? restaurantCards : null}
          {activeSection === "orders" ? <OrderList orders={orders} onStatus={updateOrderStatus} /> : null}
          {activeSection === "users" ? usersPanel : null}
          <ModalPanel isOpen={isRestaurantModalOpen} onClose={() => setIsRestaurantModalOpen(false)}>
            <RestaurantFormPanel
              role={role}
              restaurantForm={restaurantForm}
              setRestaurantForm={setRestaurantForm}
              saveRestaurant={saveRestaurant}
              isSaving={isSaving}
              ownerOptions={ownerOptions}
              addMenuItem={addMenuItem}
              updateMenuItem={updateMenuItem}
              removeMenuItem={removeMenuItem}
              showMenu
            />
          </ModalPanel>
        </section>
    );
  }

  return (
    <section className="space-y-4">
      {activeSection === "restaurants" ? restaurantCards : null}
      {activeSection === "orders" ? <OrderList orders={orders} onStatus={updateOrderStatus} /> : null}
      {activeSection === "menu" ? (
        <form onSubmit={saveRestaurant} className="restaurant-panel-soft rounded-xl p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-[#f05d3b]">Owner menu studio</p>
              <h2 className="font-display text-4xl font-black leading-none">Menu items</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{restaurantForm.menuItems?.length || 0} items in this restaurant</p>
            </div>
            <Button type="submit" disabled={isSaving} className="h-11 rounded-full bg-[#17201e] px-5 font-black text-amber-50 hover:bg-emerald-900">
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save menu"}
            </Button>
          </div>
          <MenuEditor
            menuItems={restaurantForm.menuItems || []}
            addMenuItem={addMenuItem}
            updateMenuItem={updateMenuItem}
            removeMenuItem={removeMenuItem}
          />
        </form>
      ) : null}
      {activeSection === "edit" ? <RestaurantFormPanel
        role={role}
        restaurantForm={restaurantForm}
        setRestaurantForm={setRestaurantForm}
        saveRestaurant={saveRestaurant}
        isSaving={isSaving}
        ownerOptions={ownerOptions}
        addMenuItem={addMenuItem}
        updateMenuItem={updateMenuItem}
        removeMenuItem={removeMenuItem}
      /> : null}
    </section>
  );
};

const RestaurantFormPanel = ({
  role,
  restaurantForm,
  setRestaurantForm,
  saveRestaurant,
  isSaving,
  ownerOptions,
  addMenuItem,
  updateMenuItem,
  removeMenuItem,
  showMenu = false,
}: {
  role: "admin" | "owner";
  restaurantForm: Partial<Restaurant>;
  setRestaurantForm: React.Dispatch<React.SetStateAction<Partial<Restaurant>>>;
  saveRestaurant: (event: FormEvent) => void;
  isSaving: boolean;
  ownerOptions: AuthUser[];
  addMenuItem: () => void;
  updateMenuItem: (index: number, patch: Partial<MenuItem>) => void;
  removeMenuItem: (index: number) => void;
  showMenu?: boolean;
}) => (
  <form onSubmit={saveRestaurant} className="restaurant-panel h-fit space-y-5 rounded-xl p-4 sm:p-5">
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase text-[#f05d3b]">{role === "admin" ? "Admin edit modal" : "Owner edit station"}</p>
        <h2 className="font-display text-4xl font-black leading-none">{restaurantForm._id ? "Edit restaurant" : "Add restaurant"}</h2>
        {role === "owner" ? <p className="mt-1 text-sm font-semibold text-slate-500">Restaurant name stays locked, but operations are editable.</p> : null}
      </div>
      <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-black ring-1 ring-slate-200">
        <input
          type="checkbox"
          className="h-4 w-4 accent-emerald-800"
          checked={restaurantForm.isActive ?? true}
          onChange={(event) => setRestaurantForm((current) => ({ ...current, isActive: event.target.checked }))}
        />
        Active
      </label>
    </div>

    <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
      <div className="space-y-4">
        <Field label="Restaurant name">
          <Input
            type="text"
            disabled={role === "owner"}
            className="h-12 rounded-lg border-slate-300 bg-white font-bold"
            value={restaurantForm.restaurantName || ""}
            onChange={(event) => setRestaurantForm((current) => ({ ...current, restaurantName: event.target.value }))}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="City">
            <Input type="text" className="h-11 rounded-lg border-slate-300 bg-white font-bold" value={restaurantForm.city || ""} onChange={(event) => setRestaurantForm((current) => ({ ...current, city: event.target.value }))} />
          </Field>
          <Field label="Country">
            <select
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold"
              value={restaurantForm.country || "USA"}
              onChange={(event) => setRestaurantForm((current) => ({ ...current, country: event.target.value }))}
            >
              <option value="USA">USA</option>
              <option value="Canada">Canada</option>
              <option value="UK">UK</option>
              <option value="Mexico">Mexico</option>
            </select>
          </Field>
        </div>
        <Field label="Cuisines">
          <div className="relative">
            <Tags className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              className="h-11 rounded-lg border-slate-300 bg-white pl-10 font-bold"
              value={(restaurantForm.cuisines || []).join(", ")}
              onChange={(event) => setRestaurantForm((current) => ({ ...current, cuisines: event.target.value.split(",").map((value) => value.trim()) }))}
              placeholder="Comfort, American, Brunch"
            />
          </div>
        </Field>
        {role === "admin" ? (
          <Field label="Owner">
            <select
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold"
              value={restaurantForm.ownerId || ""}
              onChange={(event) => setRestaurantForm((current) => ({ ...current, ownerId: event.target.value || null }))}
            >
              <option value="">No owner</option>
              {ownerOptions.map((owner) => <option key={owner.userId} value={owner.userId}>{owner.name}</option>)}
            </select>
          </Field>
        ) : null}
        <Field label="Image URL">
          <div className="relative">
            <Image className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input type="url" className="h-11 rounded-lg border-slate-300 bg-white pl-10 font-bold" value={restaurantForm.imageUrl || ""} onChange={(event) => setRestaurantForm((current) => ({ ...current, imageUrl: event.target.value }))} />
          </div>
        </Field>
      </div>

      <div className="space-y-4 rounded-xl bg-[#fbf6ea] p-4 ring-1 ring-slate-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-[#f05d3b]" />
          <h3 className="font-display text-2xl font-black leading-none">Operations</h3>
        </div>
        <Field label={`Delivery price ${money(restaurantForm.deliveryPrice || 0)}`}>
          <input
            type="range"
            min="0"
            max="1299"
            step="50"
            value={restaurantForm.deliveryPrice || 0}
            onChange={(event) => setRestaurantForm((current) => ({ ...current, deliveryPrice: Number(event.target.value) }))}
            className="w-full accent-emerald-800"
          />
          <Input type="number" className="mt-2 h-10 rounded-lg border-slate-300 bg-white font-bold" value={restaurantForm.deliveryPrice || 0} onChange={(event) => setRestaurantForm((current) => ({ ...current, deliveryPrice: Number(event.target.value) }))} />
        </Field>
        <Field label={`ETA ${restaurantForm.estimatedDeliveryTime || 0} minutes`}>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={restaurantForm.estimatedDeliveryTime || 0}
            onChange={(event) => setRestaurantForm((current) => ({ ...current, estimatedDeliveryTime: Number(event.target.value) }))}
            className="w-full accent-[#f05d3b]"
          />
          <Input type="number" className="mt-2 h-10 rounded-lg border-slate-300 bg-white font-bold" value={restaurantForm.estimatedDeliveryTime || 0} onChange={(event) => setRestaurantForm((current) => ({ ...current, estimatedDeliveryTime: Number(event.target.value) }))} />
        </Field>
        <div className="grid grid-cols-2 gap-2 text-sm font-black">
          <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200"><DollarSign className="mb-1 h-4 w-4 text-emerald-800" />{money(restaurantForm.deliveryPrice || 0)}</div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200"><Clock className="mb-1 h-4 w-4 text-[#f05d3b]" />{restaurantForm.estimatedDeliveryTime || 0} min</div>
        </div>
      </div>
    </div>

    {showMenu ? (
      <MenuEditor
        menuItems={restaurantForm.menuItems || []}
        addMenuItem={addMenuItem}
        updateMenuItem={updateMenuItem}
        removeMenuItem={removeMenuItem}
      />
    ) : null}

    <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
      <Button type="submit" disabled={isSaving} className="h-11 rounded-full bg-[#17201e] px-5 font-black text-amber-50 hover:bg-emerald-900">
        <Save className="h-4 w-4" />
        {isSaving ? "Saving..." : "Save changes"}
      </Button>
      {role === "admin" ? <Button type="button" variant="outline" className="h-11 rounded-full border-slate-300 bg-white font-bold" onClick={() => setRestaurantForm(blankRestaurant())}>New</Button> : null}
    </div>
  </form>
);

const MenuEditor = ({
  menuItems,
  addMenuItem,
  updateMenuItem,
  removeMenuItem,
}: {
  menuItems: MenuItem[];
  addMenuItem: () => void;
  updateMenuItem: (index: number, patch: Partial<MenuItem>) => void;
  removeMenuItem: (index: number) => void;
}) => (
  <div className="space-y-3">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase text-slate-500">Kitchen catalog</p>
        <h3 className="font-display text-3xl font-black leading-none">Menu</h3>
      </div>
      <Button type="button" variant="outline" className="h-10 rounded-full border-slate-300 bg-white font-bold" onClick={addMenuItem}><Plus className="h-4 w-4" />Item</Button>
    </div>
    {menuItems.map((item, index) => (
      <div key={item._id} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]">
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase text-slate-600">Item name</Label>
            <Input type="text" className="h-11 rounded-lg border-slate-300 bg-white font-bold" value={item.name} onChange={(event) => updateMenuItem(index, { name: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase text-slate-600">Price band</Label>
            <select
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold"
              value={item.price < 1000 ? "snack" : item.price < 1600 ? "plate" : "premium"}
              onChange={(event) => {
                const nextPrice = event.target.value === "snack" ? 799 : event.target.value === "plate" ? 1399 : 2199;
                updateMenuItem(index, { price: nextPrice });
              }}
            >
              <option value="snack">Snack</option>
              <option value="plate">Plate</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <Button type="button" variant="outline" size="icon" className="self-end rounded-full border-slate-300" onClick={() => removeMenuItem(index)}><Trash2 className="h-4 w-4" /></Button>
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase text-slate-600">Description</Label>
            <Input type="text" className="h-11 rounded-lg border-slate-300 bg-white font-bold" value={item.description || ""} onChange={(event) => updateMenuItem(index, { description: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase text-slate-600">Price {money(item.price)}</Label>
            <input
              type="range"
              min="499"
              max="2999"
              step="50"
              value={item.price}
              onChange={(event) => updateMenuItem(index, { price: Number(event.target.value) })}
              className="mt-1 w-full accent-emerald-800"
            />
            <Input type="number" className="h-10 rounded-lg border-slate-300 bg-white font-bold" value={item.price} onChange={(event) => updateMenuItem(index, { price: Number(event.target.value) })} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ModalPanel = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close modal" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-xl shadow-2xl">
        <Button type="button" size="icon" variant="outline" className="absolute right-3 top-3 z-10 rounded-full bg-white" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        {children}
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-xs font-black uppercase text-slate-600">{label}</Label>
    {children}
  </div>
);

const PriceRow = ({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) => (
  <div className={`flex justify-between ${strong ? "text-lg font-black" : ""}`}>
    <span>{label}</span>
    <span>{money(value)}</span>
  </div>
);

const EmptyState = ({ title }: { title: string }) => (
  <div className="restaurant-panel-soft rounded-[1.5rem] border-dashed p-8 text-center font-bold text-slate-500">{title}</div>
);

const OrderList = ({ orders, onStatus }: { orders: Order[]; onStatus?: (id: string, status: string) => void }) => (
  <div className="restaurant-panel-soft rounded-[1.5rem] p-4">
    <h2 className="font-display flex items-center gap-2 text-3xl font-black"><ReceiptText className="h-5 w-5 text-[#f05d3b]" />Orders</h2>
    <div className="mt-4 space-y-3">
      {orders.length === 0 ? (
        <p className="text-sm text-slate-500">No orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="rounded-2xl border-2 border-slate-950 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{order.restaurantName}</p>
                <p className="text-sm text-slate-500">{order.orderId} / {order.status}</p>
              </div>
              <p className="font-black">{money(order.total)}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
            </p>
            {onStatus ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {["Preparing", "Out for delivery", "Delivered"].map((status) => (
                  <Button key={status} variant="outline" size="sm" className="rounded-full border-2 border-slate-950 bg-card font-black" onClick={() => onStatus(order._id, status)}>{status}</Button>
                ))}
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  </div>
);

export default HomePage;
