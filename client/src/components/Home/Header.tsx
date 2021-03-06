import { Link } from "react-router-dom";
import styled from "styled-components";
import { ReactComponent as LogoImage } from "../../images/logo.svg";
import { useAuthState } from "../../state/user/UserContext";

const Header = () => {
  const { user } = useAuthState();

  return (
    <Wrapper>
      <Navigation>
        <Link to="/home">
          <Logo />
        </Link>
        <AuthMenu>
          {user ? (
            <TasksLink to="tasks">Tasks</TasksLink>
          ) : (
            <>
              <LoginLink to="login">Log In</LoginLink>
              <SignupLink to="signup">Sign Up</SignupLink>{" "}
            </>
          )}
        </AuthMenu>
      </Navigation>
    </Wrapper>
  );
};

const Wrapper = styled.header`
  background: linear-gradient(135deg, #0079bf, #5067c5);
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
`;
const Navigation = styled.nav`
  height: 72px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
`;
const Logo = styled(LogoImage)`
  height: 100%;
  width: 130px;
`;
const AuthMenu = styled.div`
  display: flex;
  align-items: center;
`;
const LoginLink = styled(Link)`
  color: #fff;
  line-height: 1.5;
  padding: 4px 8px;
  font-size: 17px;
  margin-right: 8px;
  &:hover {
    text-decoration: underline;
  }
`;
const SignupLink = styled(Link)`
  padding: 5px 8px;
  color: #0279bf;
  background-color: #fff;
  border-radius: 5px;
  font-weight: 600;
  font-size: 17px;
  line-height: 1.5;
  text-align: center;
`;
const TasksLink = styled(Link)`
  padding: 5px 10px;
  border: 2px solid #fff;
  color: #0279bf;
  background-color: #fff;
  border-radius: 5px;
  font-weight: 600;
  font-size: 17px;
  line-height: 1.5;
  text-align: center;
  &:hover,
  &:focus {
    background-color: #0279bf;
    color: #fff;
    transition: 0.2s;
  }
`;

export default Header;
