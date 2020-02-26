import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Pagination from '../../components/community/Pagination';
import { setPage } from '../../modules/community';

const PaginationContainer = () => {
    const { page, size } = useSelector(({ community }) => ({
        page: community.list.page,
        size: community.list.size,
    }));

    const dispatch = useDispatch();

    const onClick = useCallback(pageNum => {
        if(page !== pageNum) {
            dispatch(setPage({
                page: pageNum,
            }))
        }
    }, [dispatch, page]);

    const onForwardClick = useCallback(() => {
        if(page < size) {
            dispatch(setPage({
                page: page+1,
            }))
        }
    }, [dispatch, page, size]);

    const onBackwardClick = useCallback(() => {
        if(page > 1) {
            dispatch(setPage({
                page: page-1,
            }))
        }
    }, [dispatch, page])

    return (
        <Pagination
            page={page}
            size={size}
            onClick={onClick}
            onForwardClick={onForwardClick}
            onBackwardClick={onBackwardClick}
        />
    );
};

export default PaginationContainer;