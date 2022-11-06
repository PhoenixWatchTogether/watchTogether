import React, {useState} from 'react';
import { CardWrapper, CardOtt, CardDesc, CardTitle, CardPerson } from './Card.styles';
import { IoIosArrowForward } from 'react-icons/io';
import CardModal from './CardModal';

export function Card({ cardNo, ottUrl, title, people }) {
  const image = ottUrl ? ottUrl[0].image : '';
  const [isClicked, setIsClicked] = useState(false);
  const handleClick = (e) => {
    e.preventDefault();
    setIsClicked(true);
  }
  return (
    <>
      <CardWrapper type='button' onClick={handleClick}>
        <CardOtt src={image} />
        <CardDesc>
          <CardTitle>{title}</CardTitle>
          <CardPerson>모집 인원 : {people} / 4</CardPerson>
        </CardDesc>
        <IoIosArrowForward size={30} />
      </CardWrapper>
      {isClicked && <CardModal cardNo={cardNo} modal={setIsClicked} ottUrl={ottUrl}/>}
    </>
  );
}
