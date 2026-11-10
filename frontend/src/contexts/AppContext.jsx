import React,{createContext,useContext,useState,useEffect,useCallback} from 'react';
import {api} from '../lib/api';
const ToastContext=createContext(null),AuthContext=createContext(null),CartContext=createContext(null),WishContext=createContext(null);
export const useToast=()=>useContext(ToastContext);export const useAuth=()=>useContext(AuthContext);export const useCart=()=>useContext(CartContext);export const useWish=()=>useContext(WishContext);
export function ToastProvider({children}){
 const [toasts,setToasts]=useState([]);
 const notify=useCallback((message,type='success')=>{const id=Date.now()+Math.random();setToasts(s=>[...s,{id,message,type}].slice(-4));setTimeout(()=>setToasts(s=>s.filter(x=>x.id!==id)),3500);},[]);
 return <ToastContext.Provider value={{notify}}>{children}<div className="fixed bottom-5 right-5 z-[100] grid gap-2 max-w-[90vw] w-[340px]" aria-live="polite">{toasts.map(t=><div key={t.id} className={`toast rounded-2xl border px-4 py-3 shadow-xl text-sm font-semibold ${t.type==='error'?'bg-red-50 border-red-200 text-red-700':'bg-white border-orange-100 text-ink'}`}>{t.type==='error'?'⚠ ':'✓ '}{t.message}</div>)}</div></ToastContext.Provider>;
}
export function AuthProvider({children}){
 const [user,setUser]=useState(null),[loading,setLoading]=useState(!!localStorage.getItem('tech_token'));
 const refresh=useCallback(async()=>{const token=localStorage.getItem('tech_token');if(!token){setUser(null);setLoading(false);return;}try{const {data}=await api.get('/auth/me');setUser(data.user)}catch{localStorage.removeItem('tech_token');setUser(null)}finally{setLoading(false)}},[]);
 useEffect(()=>{refresh()},[refresh]);
 const signIn=async fields=>{const {data}=await api.post('/auth/login',fields);localStorage.setItem('tech_token',data.token);setUser(data.user);return data.user};
 const signUp=async fields=>{const {data}=await api.post('/auth/register',fields);localStorage.setItem('tech_token',data.token);setUser(data.user);return data.user};
 const logout=()=>{localStorage.removeItem('tech_token');setUser(null)};
 return <AuthContext.Provider value={{user,loading,signIn,signUp,logout,refresh}}>{children}</AuthContext.Provider>;
}
function readLocal(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
export function CartProvider({children}){
 const {user}=useAuth(),{notify}=useToast();const [items,setItems]=useState([]),[loading,setLoading]=useState(false);
 const load=useCallback(async()=>{if(!user)return;setLoading(true);try{const {data}=await api.get('/cart');setItems((data.items||[]).filter(i=>i.product).map(i=>({product:i.product,quantity:i.quantity,selected:i.selected})));}catch(e){notify(e.message,'error')}finally{setLoading(false)}},[user?.id]);
 useEffect(()=>{if(user){(async()=>{const guest=readLocal('tech_guest_cart',[]);if(guest.length){localStorage.removeItem('tech_guest_cart');for(const item of guest){try{await api.post('/cart/items',{productId:item.product._id,quantity:item.quantity})}catch{}}localStorage.removeItem('tech_guest_cart')}await load()})()}else{setItems(readLocal('tech_guest_cart',[]))}},[user?.id]);
 const persist=next=>{setItems(next);localStorage.setItem('tech_guest_cart',JSON.stringify(next))};
 const add=async(product,quantity=1)=>{
  try{if(user){const {data}=await api.post('/cart/items',{productId:product._id,quantity});setItems(data.items.filter(i=>i.product).map(i=>({product:i.product,quantity:i.quantity,selected:i.selected})));}
  else{const curr=readLocal('tech_guest_cart',[]);const ex=curr.find(i=>i.product._id===product._id);const nextQty=(ex?.quantity||0)+quantity;if(nextQty>product.stock)throw new Error('Số lượng vượt tồn kho');persist(ex?curr.map(i=>i.product._id===product._id?{...i,quantity:nextQty,selected:true}:i):[...curr,{product,quantity,selected:true}]);}
  notify('Đã thêm sản phẩm vào giỏ hàng');return true;
  }catch(e){notify(e.message,'error');return false}
 };
 const update=async(id,quantity)=>{try{if(user){const {data}=await api.put(`/cart/items/${id}`,{quantity});setItems(data.items.filter(i=>i.product).map(i=>({product:i.product,quantity:i.quantity,selected:i.selected})))}else persist(items.map(i=>i.product._id===id?{...i,quantity}:i).filter(i=>i.quantity>0));}catch(e){notify(e.message,'error')}};
 const remove=async id=>{try{if(user){const {data}=await api.delete(`/cart/items/${id}`);setItems(data.items.filter(i=>i.product).map(i=>({product:i.product,quantity:i.quantity,selected:i.selected})))}else persist(items.filter(i=>i.product._id!==id));notify('Đã xóa khỏi giỏ hàng')}catch(e){notify(e.message,'error')}};
 const toggle=async(id,selected)=>{try{if(user){const {data}=await api.patch(`/cart/items/${id}`,{selected});setItems(data.items.filter(i=>i.product).map(i=>({product:i.product,quantity:i.quantity,selected:i.selected})))}else persist(items.map(i=>i.product._id===id?{...i,selected}:i));}catch(e){notify(e.message,'error')}};
 const count=items.reduce((a,i)=>a+i.quantity,0);const subtotal=items.filter(i=>i.selected).reduce((a,i)=>a+i.product.price*i.quantity,0);
 return <CartContext.Provider value={{items,loading,count,subtotal,add,update,remove,toggle,load}}>{children}</CartContext.Provider>;
}
export function WishProvider({children}){
 const [ids,setIds]=useState(()=>readLocal('tech_wish',[]));const {notify}=useToast();
 const toggle=id=>{const next=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];setIds(next);localStorage.setItem('tech_wish',JSON.stringify(next));notify(ids.includes(id)?'Đã bỏ khỏi yêu thích':'Đã thêm vào yêu thích')};
 return <WishContext.Provider value={{ids,toggle}}>{children}</WishContext.Provider>;
}
