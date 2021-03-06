import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { UserContext } from "./state/user/UserContext";

const client = new ApolloClient({
  uri: "http://localhost:4000/graphql",
  cache: new InMemoryCache(),
  credentials: "include",
});

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <UserContext>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </UserContext>
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
