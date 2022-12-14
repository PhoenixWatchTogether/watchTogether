import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { animate, motion } from 'framer-motion';
import {
  Wrapper,
  Description,
  GatherForm,
  Label,
  CustomInput,
  Text,
  SubmitButton,
  ErrorMessage,
} from './AddParty.styles';
import SearchModal from './SearchModal';
import { createParty } from '../../api/Parties';
import { postAlert } from '../../api/Alert';
import { getInfo } from '../../api/Users';
import {postAuth} from '../../api/OttAuth'
import otts from '../../mocks/platform'

const AddParty = () => {
  const { value } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { state } = useLocation();
  const initialValues = {
    ottId: state.ott,
    title: '',
    body: '',
    partyOttId: '',
    partyOttPassword: '',
    leaderNickName: value.nickname,
  };
  const [formValues, setFormValues] = useState(initialValues);
  const [formErrors, setFormErrors] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isVaildate, setIsValidate] = useState(false);
  const [inviteMember, setinviteMember] = useState([]);

  const createForm = (body, accessToken) => {
    createParty(body, accessToken)
      .then((res) => {
        console.log(res.data);
        res.data && sendAlert(res.data, accessToken);
        toast.success(<h1>모집 글이 등록되었습니다</h1>, {
          position: 'top-center',
          autoClose: 1500,
        });
        setTimeout(() => {
          navigate('/partyList');
        }, 1500);
      })
      .catch((error) => {
        toast.error(error.response.data.message, {
          position: 'top-center',
          autoClose: 1000,
        });
      });
  };

  const sendAlert = (body, token) => {
    let member = {};
    // eslint-disable-next-line array-callback-return
    body.map((data) => {
      member = {
        nickName: [data.nickName],
        inviteId: data.uuid,
        type: data.alertType,
        partyId: data.partyId,
        message: `${data.sender} 님께서 ${data.nickName} 님을 파티에 초대하셨습니다.`,
      };

      console.log(member);
      postAlert(member, token)
        .then((res) => console.log(res))
        .catch((error) => console.log(error.response.data.message));
    });

    console.log(member);
  };

  const accessToken = localStorage.getItem('access-token');
  const getUserInfo = () => {
    return getInfo(accessToken).then((res) => res.data);
  };
  const { data } = useQuery('getInfo', getUserInfo);

  if (data) {
    formValues.leaderNickName = data.nickname;
  };

  const submitForm = () => {
    const accessToken = localStorage.getItem('access-token');
    const invite = inviteMember.length !== 0 ? inviteMember.join() : null;
    const createData = { ...formValues, receiversNickName: invite };
    const filterType = otts.filter((a) => a.id === state.ott);
    const authData = {
      id: formValues.partyOttId,
      password: formValues.partyOttPassword,
      ottType: filterType[0].type,
    };

    postAuth(authData, accessToken)
      .then((res) => {
        console.log(res.data);
        if(res.data.loginResult === '1') {
          createForm(createData, accessToken);
        } else {
          toast.error(<h1>일치하는 플랫폼 계정이 없습니다.</h1>, {
            position: 'top-center',
            autoClose: 1000,
          });
        }
        })
    
  };

  const validate = (values) => {
    let error = '';

    if (!values.partyOttPassword) {
      error = 'OTT 플랫폼 비밀번호를 등록해주세요.';
    }
    if (!values.partyOttId) {
      error = 'OTT 플랫폼 계정을 등록해주세요.';
    }
    if (!values.title) {
      error = '제목을 입력해주세요';
    }
    return error;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormErrors(validate(formValues));

    if (validate(formValues) === '') {
      submitForm();
    }

    setIsValidate(true);
  };

  useEffect(() => {
    if (formErrors === undefined && isVaildate) {
      submitForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleClick = (e) => {
    e.preventDefault();
    if (inviteMember.length === 3) {
      toast.error(
        <>
          <h1>파티 초대 정원 초과</h1>
          <p>파티원 초대는 최대 3명까지만 가능합니다.</p>
        </>,
        {
          position: 'top-center',
          autoClose: 1000,
        },
      );
    } else {
      setIsOpen(true);
    }
  };

  return (
    <motion.div
      className="selectPage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Wrapper>
        <ToastContainer />
        <GatherForm onSubmit={handleSubmit}>
          <Description>파티원을 모집하거나, 원하는 지인을 초대할 수 있어요.</Description>
          {formErrors && <ErrorMessage className="error">{formErrors}</ErrorMessage>}
          <Label htmlFor="title">모집 제목</Label>
          <CustomInput
            type="text"
            name="title"
            defalutValue={formValues.title}
            onChange={handleChange}
          />

          <Label htmlFor="searchMember">파티원 초대하기</Label>
          <CustomInput
            type="text"
            name="searchMember"
            placeholder="찾으려는 파티원의 닉네임을 입력해주세요."
            value={inviteMember}
            onClick={handleClick}
          />

          <Label htmlFor="ottId">OTT 플랫폼 계정</Label>
          <CustomInput
            mb="0"
            type="text"
            name="partyOttId"
            placeholder="ID"
            defalutValue={formValues.partyOttId}
            onChange={handleChange}
          />
          <CustomInput
            type="password"
            name="partyOttPassword"
            placeholder="Password"
            defalutValue={formValues.partyOttPassword}
            onChange={handleChange}
          />

          <Label htmlFor="body">모집 글</Label>
          <Text
            name="body"
            placeholder="여기에 입력하세요"
            defalutValue={formValues.body}
            onChange={handleChange}
          />

          <SubmitButton type="submit">등록하기</SubmitButton>
        </GatherForm>

        {isOpen && (
          <SearchModal
            setinviteMember={setinviteMember}
            inviteMember={inviteMember}
            setIsOpen={setIsOpen}
          />
        )}
      </Wrapper>
    </motion.div>
  );
};

export default AddParty;
