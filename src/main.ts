import { createApp, provide, h } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "@/assets/base.css";
import "@progress/kendo-theme-default/dist/all.css";

import {
  ApolloClient,
  createHttpLink,
  gql,
  InMemoryCache,
} from "@apollo/client/core";

import { DefaultApolloClient } from "@vue/apollo-composable";

// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: "https://uk.api.8base.com/cl5hs0p9f08p309l5c70w358g",
});

// Cache implementation
const cache = new InMemoryCache();

// Create the apollo client
const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
});

// apolloClient.query({
//   query: gql`
//     query BoardsList {
//       boardsList {
//         items {
//           id
//           title
//           image {
//             downloadUrl
//           }
//         }
//       }
//     }
//   `,
// });

const app = createApp(
  {
    setup() {
      provide(DefaultApolloClient, apolloClient);
    },

    render: () => h(App),
  },
  App
);

app.use(router).use(createPinia());

app.mount("#app");
