'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { type State, WagmiProvider } from 'wagmi';

import { getConfig } from '@/lib/wagmi';
import MiniappProvider from './MiniappProvider';
import { ThemeProvider } from '../theme-provider';

export function Providers(props: {
    children: ReactNode;
    initialState?: State;
}) {
    const [config] = useState(() => getConfig());
    const [queryClient] = useState(() => new QueryClient());

    return (

        <WagmiProvider config={config} initialState={props.initialState}>
            <QueryClientProvider client={queryClient}>
                <OnchainKitProvider
                    apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
                    chain={base}
                >
                    <MiniappProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            {props.children}
                        </ThemeProvider>
                    </MiniappProvider>
                </OnchainKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );

}
