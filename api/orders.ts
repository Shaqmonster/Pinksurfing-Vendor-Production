import axios from 'axios';
const BASE_URL = 'https://ecommerceapi.pinksurfing.com/api'


    
export async function getOrders(token:string | null){
    let res = await axios.get(`${BASE_URL}/vendor/all-orders/`,{
        headers:{
            "Authorization":`Bearer ${token?.replaceAll('"','')}`
        }
    })
    .then(response=>response)
    .catch(error=>error);
    return res;
}
export async function changeStatus(token:string | null, order_id: string | null){
    let res = await axios.get(`${BASE_URL}/vendor/change-order-status/${order_id}/`,{
        headers:{
            "Authorization":`Bearer ${token?.replaceAll('"','')}`
        }
    })
    .then(response=>response)
    .catch(error=>error);
    return res;
}