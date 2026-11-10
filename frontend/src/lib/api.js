import axios from 'axios';
export const api=axios.create({baseURL:'/api',timeout:20000});
api.interceptors.request.use(config=>{const token=localStorage.getItem('tech_token');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
api.interceptors.response.use(response=>response,error=>Promise.reject(new Error(error.response?.data?.message||error.message||'Không thể kết nối máy chủ')));
export const vnd=n=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(Number(n||0));
export const dateVN=v=>v?new Date(v).toLocaleString('vi-VN'):'—';
export const img=p=>p?.startsWith('http')?p:(p||'/products/headphones-1.svg');
export const statuses={pending:'Chờ xác nhận',confirmed:'Đã xác nhận',shipping:'Đang giao',delivered:'Đã giao',cancelled:'Đã hủy'};
export const safeText=s=>String(s||'').trim();
