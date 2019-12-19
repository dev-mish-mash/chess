import React, { useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import HeaderContainer from '../containers/common/HeaderContainer';
import GameLayoutContainer from '../containers/common/GameLayoutContainer';

const GamePage = ({ history, match }) => {
    useEffect(() => {
        if(!match.params.id) {
            history.push('/');
        }
    }, [history, match]);

    if(!match.params.id) return null;
    const { id } = match.params;
    if(!id) return null;
    
    return (
        <>
            <HeaderContainer />
            <GameLayoutContainer gameId={id}/>
        </>
    )
};

export default withRouter(GamePage);