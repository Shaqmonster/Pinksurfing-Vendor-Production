import axios from 'axios';
const BASE_URL = 'https://ecommerceapi.pinksurfing.com'


    
export async function emailResetLink(email:string){
    return await axios.post(`${BASE_URL}/password_reset/`,{
       email
    })
}

    
export async function passwordConfirm({password,token}:any){
    return await axios.post(`${BASE_URL}/password_reset/confirm/`,{
       password,
       token
    })
}
    
export async function validateToken({token}:any){
    return await axios.post(`${BASE_URL}/password_reset/validate_token/`,{
       token
    })
}
