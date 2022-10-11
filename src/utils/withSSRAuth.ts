import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthToeknError";
import  decode from 'jwt-decode';
import { validadeUserPermissions } from "./validadeUserPermissions";

type WithSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
}

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions) {
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>>  => {
    const cookies = parseCookies(ctx);
    const token = cookies['signinauth.token'];

    if(!token) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        }
      }
    }

    if(options){ 
      const user = decode<{ permissions: string[], roles: string[] }>(token);
      const { permissions, roles } = options;
  
      const userHasValidPermissions = validadeUserPermissions({
        user,
        permissions,
        roles
      });

      if(!userHasValidPermissions) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          }
        }
      }
    }
    

    try {
      return await fn(ctx)
    } catch (err) {
      if(err instanceof AuthTokenError) {
        //console.log(err instanceof AuthTokenError)
        destroyCookie(ctx, 'signinauth.token')
        destroyCookie(ctx, 'signinauth.refreshToken')
    
        return {
          redirect: {
            destination: '/',
            permanent: false,
          }
        }
      }
    }
  }
}