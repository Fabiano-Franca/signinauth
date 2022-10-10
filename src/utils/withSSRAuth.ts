import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthToeknError";

export function withSSRAuth<P>(fn: GetServerSideProps<P>) {
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>>  => {
    const cookies = parseCookies(ctx);
  
    if(!cookies['signinauth.token']) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
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