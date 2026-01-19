// import clsx from 'clsx'; 
import{
    LiaInfoCircleSolid
} from 'react-icons/lia';
import 'react-jsx';

import { Book } from '../../../types/book';
import {useEnv} from '../../../context/EnvContext';
import {useResponsiveSize} from '../../../hooks/useResponsiveSize';

interface BookItemProbs{
    book : Book;
    handleBookUpload : (book : Book) => void;
    handleBookDownload : (book : Book) => void;
    showBookDetailsModal :(book : Book) => void;
}

const BookItem : React.FC<BookItemProbs> = (
    {book,
    // handleBookUpload,
    // handleBookDownload,
    showBookDetailsModal,
}) => {
    const {AppService} = useEnv();
    const iconSize15 = useResponsiveSize(15);
    return (
        <div>
            <div>
                <div>
                    <div>
                        {AppService?.isMobile&&(
                        <button
                            arial-label = {('Show Book Detaila')}
                            className = 'show-detail-button -m-2 p-2 sm:opacity-0 sm:group-hover:opacity-100'
                            onPointerDown = {(e) => e.stopPropagation}
                            onClick = {
                                () => {showBookDetailsModal(book);}
                            }
                        >
                            <div className = 'pt-[2px] sm:pt-[1px]'>
                                <LiaInfoCircleSolid size = {iconSize15} />
                            </div>
                        </button>
                        )}
                    </div>
                </div>
            </div>
        </div>


    );

}

export default BookItem;