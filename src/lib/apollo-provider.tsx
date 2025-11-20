"use client";

import { ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { ApolloNextAppProvider } from "@apollo/client-integration-nextjs";

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

function createMakeClient() {
  let integration: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    integration = require("@apollo/client-integration-nextjs");
  } catch {
    integration = null;
  }

  const ClientCtor =
    integration?.ApolloClient ||
    integration?.NextSSRApolloClient ||
    integration?.NextApolloClient ||
    integration?.NextApollo ||
    null;

  const CacheCtor =
    integration?.InMemoryCache || integration?.NextSSRInMemoryCache || null;

  const SSRMultipartLinkCtor = integration?.SSRMultipartLink || null;

  return function makeClient() {
    const httpLink = new HttpLink({ uri: "/api/graphql", credentials: "include" });

    const link =
      typeof window === "undefined"
        ? ApolloLink.from([
            ...(SSRMultipartLinkCtor ? [new SSRMultipartLinkCtor({ stripDefer: true })] : []),
            authLink.concat(httpLink),
          ])
        : authLink.concat(httpLink);

    if (ClientCtor) {
      const cacheInstance = CacheCtor ? new CacheCtor() : new InMemoryCache();
      return new ClientCtor({
        ssrMode: typeof window === "undefined",
        link,
        cache: cacheInstance,
      });
    }

    return new (require("@apollo/client").ApolloClient)({
      ssrMode: typeof window === "undefined",
      link,
      cache: new InMemoryCache(),
    });
  };
}

const makeClient = createMakeClient();

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
