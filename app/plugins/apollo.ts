import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core';
import { DefaultApolloClient } from '@vue/apollo-composable';

// Create Apollo client with simplified configuration
export const apolloClient = new ApolloClient({
  link: createHttpLink({
    uri: 'https://api.tarkov.dev/graphql',
    fetchOptions: { timeout: 10000 },
  }),
  cache: new InMemoryCache(),
});

export default defineNuxtPlugin((nuxtApp) => {
  // Provide Apollo client to Vue app & composables
  nuxtApp.vueApp.provide(DefaultApolloClient, apolloClient);
  nuxtApp.provide('apollo', apolloClient);
});
