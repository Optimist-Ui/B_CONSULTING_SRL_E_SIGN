import { PropsWithChildren } from 'react';
import App from '../../App';
import ChatWidget from '../Chatbot/ChatWidget';

const BlankLayout = ({ children }: PropsWithChildren) => {
    return (
        <App>
            <div className="text-black dark:text-white-dark min-h-screen">
                {children}
                <ChatWidget />
            </div>
        </App>
    );
};

export default BlankLayout;
