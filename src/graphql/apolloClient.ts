import {
    ApolloClient,
    createHttpLink,
    InMemoryCache,
  } from "@apollo/client/core";

  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT

  const httpLink = createHttpLink({
    uri: apiEndpoint,
  });
  
  const cache = new InMemoryCache();
  
  export const apolloClient = new ApolloClient({
    link: httpLink,
    cache,
  });