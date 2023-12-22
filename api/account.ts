import axios from 'axios';

const BASE_URL = 'https://ecommerceapi.pinksurfing.com/api';

export async function getOnboardingUrl(token: string) {
  try {
    const response = await axios.get(`${BASE_URL}/vendor/get-onboarding-url/`, {
      headers: {
        Authorization: `Bearer ${token.replaceAll('"', '')}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching onboarding URL:', error);
    throw error; 
  }
}
  

export async function signUp(payload:any){
    let res = await axios.post(`${BASE_URL}/vendor/create-account/`,
    payload
    ).then(async (response: any)=>{
    let data = {}
    if(response.status < 205 && response.data.vendor_id){
        let {username , password} = payload;
            let token = await axios.post(`${BASE_URL}/token/`,{
                username,
                password
            })
            data = {...token, vendor_id:response.data.vendor_id}
    }else{
        data = response
    }
    return data
})
.catch(err=>err)
console.log(res)
return res;
}
export async function signIn(payload:any){
    let res = await axios.post(`${BASE_URL}/token/`,
    payload
    ).then(async (response: any)=>{
    let data = {}
    if(response.status < 205 && response.data.access){
        let {access , refresh} = response.data;
            let vendor = await axios.get(`${BASE_URL}/vendor/profile/`,{
                headers:{
                    "Authorization" : "Bearer "+access
                }
            })
            data = {...vendor, token:access, refresh}
    }else{
        data = response
    }
    return data
})
.catch(err=>err)
console.log(res)
return res;
}


export async function getProfile(token:string | null){
    let res = await axios.get(`${BASE_URL}/vendor/profile/`,{
        headers:{
            "Authorization":`Bearer ${token?.replaceAll('"','')}`
        }
    })
    .then(response=>response)
    .catch(error=>error);
    return res;
}