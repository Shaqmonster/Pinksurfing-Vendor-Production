import { Product } from '@/types/product';
import axios from 'axios';



const BASE_URL = 'https://ecommerceapi.pinksurfing.com/api'

export async function getAllOrders(token: string | null) {
    if (!token) {
        return { error: true, data: null };
    }

    try {
        const response = await axios.get(`${BASE_URL}/vendor/all-orders/`, {
            headers: {
                Authorization: `Bearer ${token.replaceAll('"', '')}`,
            },
        });

        const { status, data } = response;
        return { status, data, error: false };
    } catch (error) {
        return { error: true, data: null };
    }
}

export async function getVendorProfile(token: string | null) {
    if (!token) {
        return { error: true, data: null };
    }

    try {
        const response = await axios.get(`${BASE_URL}/vendor/profile/`, {
            headers: {
                Authorization: `Bearer ${token.replaceAll('"', '')}`,
            },
        });

        const { status, data } = response;
        return { status, data, error: false };
    } catch (error) {
        return { error: true, data: null };
    }
}

export async function updateVendorProfile(token: string | null, profileData: any) {
    if (!token) {
        return { error: true, data: null };
    }

    try {
        const response = await axios.post(`${BASE_URL}/vendor/profile/`, profileData, {
            headers: {
                Authorization: `Bearer ${token.replaceAll('"', '')}`,
            },
        });

        const { status, data } = response;
        return { status, data, error: false };
    } catch (error) {
        return { error: true, data: null };
    }
}



export async function getCategories() {
    const res = await axios.get(BASE_URL+'/product/categories/');
    const {data} = res;
    if(!data){
        return {error:true,data:null}
    }
    return data;
}

export async function deleteProduct(token: string | null, vendor: string | null, productId: string) {
    
    if (!token || !vendor) {
        return false;
    }

    try {
        const response = await axios.delete(`${BASE_URL}/product/delete-product/${productId}/`, {
            headers: {
                "Authorization": `Bearer ${token.replaceAll('"', '')}`,
            },
        });

        const { status, data } = response;
        return { status, data, error: false };
    } catch (error) {

    }
}


export async function getSubcategories() {
    const res = await axios.get(BASE_URL+`/product/subcategories/`);
    const {data} = res;
    if(!data){
        return {error:true,data:null}
    }
    return data;
}
export async function saveProducts(token: string | null, vendor: string | null, payload: Product, attribute: any, images: File[]) {
    if(!token || !vendor){
        return false
    }
    vendor = vendor.replaceAll('"','')
    let form = new FormData();

    for(let [key , value] of Object.entries(payload)){
        if(key !== 'image' ){
            form.append(key , value.toString())
        }
    }

  for (let image of images) {
    form.append('file', image);
    form.append('image', image);
  }

    form.append('attributes',JSON.stringify(attribute))
    form.append('vendor',vendor)
    const res = await axios.post(`${BASE_URL}/product/add-product/`,
    form, {
        headers:{
            "Authorization": `Bearer ${token.replaceAll('"','')}`,
            "Content-Type": "multipart/form-data"
        },
    })
    .then(response=>{
        let { status , data } = response
        return { status , data , error:false} 
    })
    .catch(error => {
        let { status, message , response } = error;
        return { status , data: response , message, error:true}
    })

    const {data} = res;
    return data;
   }

export async function updateProducts(token:string|null , vendor:string|null, payload:any) {
    if(!token || !vendor){
        return false
    }
    vendor = vendor.replaceAll('"','')
    let form = new FormData();
    form.append('vendor',vendor)

    for(let [key , value] of Object.entries(payload)){
        if(key !== 'image' && key !== 'id' ){
            form.append(key , `${value}`)
        }
    }
    if('image' in payload){
        form.append('file' , payload['image'])
        form.append('image' , payload['image'])
    }
    if(!('id' in  payload)){
        return false
    }
    const res = await axios.put(`${BASE_URL}/product/edit-product/${payload['id']}/`,
    form, {
        headers:{
            "Authorization": `Bearer ${token.replaceAll('"','')}`,
            // "Content-Type": "multipart/form-data"
        },
    })
    .then(response=>{
        let { status , data } = response
        return { status , data , error:false} 
    })
    .catch(error => {
        let { status, message , response } = error;
        return { status , data: response , message, error:true}
    })

    return res;
   }

   export async function getSingleOrder(token: string | null, orderId: string) {
    if (!token || !orderId) {
      return { error: true, data: null };
    }
  
    try {
      const response = await axios.get(`${BASE_URL}/vendor/single-order/${orderId}/`, {
        headers: {
          Authorization: `Bearer ${token.replaceAll('"', '')}`,
        },
      });
  
      const { status, data } = response;
      return { status, data, error: false };
    } catch (error) {
      return { error: true, data: null };
    }
  }
  
   
export async function getProducts(token:string | null, vendor:string | null){
    let res = await axios.get(`${BASE_URL}/product/vendor-products/${vendor?.replaceAll('"','')}/`,{
        headers:{
            "Authorization":`Bearer ${token?.replaceAll('"','')}`
        }
    })
    .then(response=>response)
    .catch(error=>error);
    return res;
}

export async function changeOrderStatus(token: string | null, orderId: string, status: string) {
    if (!token || !orderId) {
        return { error: true, data: null };
    }

    try {
        const response = await axios.post(`${BASE_URL}/vendor/change-order-status/${orderId}/`, { status }, {
            headers: {
                Authorization: `Bearer ${token.replaceAll('"', '')}`,
            },
        });

        const { status: responseStatus, data } = response;
        return { status: responseStatus, data, error: false };
    } catch (error) {
        return { error: true, data: null };
    }
}
