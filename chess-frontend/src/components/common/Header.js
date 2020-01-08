import React from 'react';
import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { GoSearch } from 'react-icons/go';
import { IconContext } from 'react-icons';

import RoomModalContainer from '../../containers/modal/RoomModalContainer';

const HeaderBlock = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 50px;
`;

const titleStyle = css`
    display: flex;
    justify-content: center;
    align-items: flex-start;
    height: 40px;
    background-color: transparent;
    cursor: pointer;
    font-size: 30px;
    text-decoration: none;
    text-shadow: 2px 2px 2px rgb(0, 0, 0, 0.2);
    font-style: italic;
`;

const TitleBlock = styled(Link)`
    ${titleStyle}
    color: rgb(0, 0, 0, 0.6);
`;

const TitleFadeBlock = styled(Link)`
    ${titleStyle}
    color: rgb(0, 0, 0, 0.4);
`;

const ControllBlock = styled.div`
    display: flex;
    align-items: center;
    margin-left: 8%;
`;

const GroupBlock = styled.div`
    margin-left: 30px;
    display: flex;
`;

const TabBlock = styled.div`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50px;
    font-size: 16px;
    cursor: pointer;
    color: rgb(0, 0, 0, 0.4);
    margin-left: 20px;
`;

const TabLinkBlock = styled(Link)`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50px;
    font-size: 16px;
    cursor: pointer;
    color: rgb(0, 0, 0, 0.4);
    margin-left: 20px;
    text-decoration: none;
    
    ${props => props.hidden && css`
        display: none;
        visibility: hidden;
    `};
`;

const Tab = props => {
    if(props.to) {
        return (
            <TabLinkBlock {...props}>
                {props.children}
            </TabLinkBlock>
        )
    } else {
        return (
            <TabBlock {...props}>
                {props.children}
            </TabBlock>
        )
    }
}

const AuthBlock = styled.div`
    display: flex;
    align-items: center;
    margin-right: 8%;
`;

const UserWelcomeBlock = styled.div`
    position: absolute;
    top: 10%;
    left: 0%;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    font-size: 10px;
    color: rgb(0, 0, 0, 0.4);
`

const Header = ({ onToggle, openModal, setOpenModal, onRecord, onLogout, session, auth }) => {
    let username;
    if(session) {
        username = session.nickname;
        if(auth) {
            username = auth.username;
        }
    };

    return (
        <>
            <HeaderBlock>
                <ControllBlock>
                    <TitleBlock to='/'>
                        chessup
                    </TitleBlock>
                    <TitleFadeBlock to='/'>
                        .com
                    </TitleFadeBlock>
                    <GroupBlock>
                        <Tab onClick={onToggle}>
                            QuickPlay
                        </Tab>
                        <Tab to='/'>
                            Play
                        </Tab>
                        <Tab to='/community'>
                            Community
                        </Tab>
                    </GroupBlock>
                </ControllBlock>
                <AuthBlock>
                    <Tab onClick={onRecord}>
                        Search
                    </Tab>
                    {auth ? (
                        <>
                            <Tab onClick={onRecord}>
                                Setting
                            </Tab>
                            <Tab onClick={onRecord}>
                                Record
                            </Tab>
                            <Tab onClick={onLogout}>
                                Logout
                                <UserWelcomeBlock>
                                    {username}
                                </UserWelcomeBlock>
                            </Tab>
                        </>
                    ):(
                        <Tab to='/login'>
                            Login
                            <UserWelcomeBlock>
                                {username}
                            </UserWelcomeBlock>
                        </Tab>
                    )}
                </AuthBlock>
            </HeaderBlock>
            <RoomModalContainer
                openModal={openModal}
                setOpenModal={setOpenModal}
            />
        </>
    )
};

export default React.memo(Header);