import React, { Component } from 'react'
import { Button } from '@alife/next'
import { urlSearchToObject } from '../../common/util/parse'
import './index.scss';
import { setTimeout, log } from 'core-js';
import { POINT_CONVERSION_COMPRESSED } from 'constants';

class ValidateTip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tipClassName: '', //'tip-content-hidden',
      query: urlSearchToObject(window.location),
      isNotModify: false,
      warning1: [], // 非兼容变更
      warning2: true,  // 未支持HTTPS
      warning3: [], // 对称性
      warning4: [], // 入参
      warning5: [], // 出参
      warning6: [], //aip名称
      warning7: [], //ROA path规则
    }
  }

  showTipDetail = () => {
    const { tipClassName } = this.state;
    this.isNeedUpdate = false;
    this.setState({
      tipClassName: (tipClassName ? '' : 'tip-content-hidden'),
      isNotModify: true,
    })
  }

  /**
   * @returns Boolean 是否有warning
   */
  hasWaring = () => {
    const { warning1, warning2, warning3, warning4, warning5, warning6, warning7 } = this.state;
    if (warning1.length === 0 && warning2 === false && warning3.length === 0 && warning4.length === 0 && warning5.length === 0 && warning6.length === 0) {
      return false; // 无warning
    } else {
      return true;  // 有warning
    }
  }

  /** 判断是够启用日常发布按钮
   * @returns Boolean 是否暂不修改warning
   */
  hasNotModify = () => {
    if (!this.hasWaring()) { // 无warning
      return true;
    } else if (this.state.isNotModify) { // 有warning，但是用户点击了暂不修改按钮
      return true;
    } else { // 其它情况
      return false;
    }
  }

  notifyParent = () => {
    const { isCanPublish } = this.props;
    if (isCanPublish && typeof isCanPublish === 'function') {
      isCanPublish(this.hasNotModify());
    }
  }

  componentWillReceiveProps({ diff, apiData }) {
    let w1 = [];
    let w2 = true;
    let w3 = [];
    let w4 = [];
    let w5 = [];
    let w6 = [];
    let w7 = [];
    const api = this.props.apiData.name;
    const extendInfo = this.props.apiData.extendInfo;
    const isvProtocol = this.props.apiData.isvProtocol;
    const isUp = /^[A-Z]/.test(api);
    if (diff && diff.length > 0) {
      w1 = diff.map(val => {
        // rhs新值，lhs原值
        const { rhs, lhs, path } = val;
        const firstPath = path.shift();
        const lastPath = path.pop();
        if (firstPath === 'parameters' && lastPath === 'tagName') {
          return `入参名称"${lhs}"变更为"${rhs}"，非兼容`;
        } else if (firstPath === 'resultMapping' && lastPath === 'tagName') {
          return `出参名称"${lhs}"变更为"${rhs}"，非兼容`;
        }
        return null;
      }).filter(val => val);
    }
    if (apiData && apiData.isvProtocol) {
      // const protocol = apiData.isvProtocol.protocol;
      // const hasHttps = protocol.search('HTTPS') !== -1;
      // w2 = !hasHttps;
      try {
        const protocol = apiData.isvProtocol.protocol;
        const hasHttps = protocol.search('HTTPS') !== -1;
        w2 = !hasHttps;
      } catch (error) {
      }
    }
    if (window.validateInfo) {
      const { parameterTagName, resultTagName } = window.validateInfo;
      for (let key in parameterTagName) {
        if (parameterTagName.hasOwnProperty(key)) {
          w4.push(`参数名${key}建议首字母大写`);
        }
      }
      for (let key in resultTagName) {
        if (resultTagName[key]) {
          w5.push(`参数名${key}建议首字母大写`);
        }
      }
      if(!(Object.prototype.hasOwnProperty.call(resultTagName, 'requestId') || Object.prototype.hasOwnProperty.call(resultTagName, 'RequestId'))){//判断resultTagName是否有RequestId、requestId属性
        w5.push(`参数RequestId不存在`);
      }
    }
    if (!isUp) {
      w6.push('API命名需符合大驼峰式，单词首字母大写');
    }
    if (extendInfo) {
      if (extendInfo.apiInvokeType == 'ROA')　{
        if (isvProtocol) {
          if (!/^\/[a-z\/]{0,}$/.test(isvProtocol.pattern))　{
            w7.push('ROA的path全小写，以/开头。例如：/web/cloudapi，不可以是/Web/Cloudapi');
          }
        }
      }
    }

    this.setState({
      warning1: w1,
      warning2: w2,
      warning3: w3,
      warning4: w4,
      warning5: w5,
      warning6: w6,
      warning7: w7,
    })
  }


  componentDidUpdate() {
    const { apiData } = this.props;
    if (apiData && apiData.isvProtocol && !this.isNeedUpdate) {
      this.isNeedUpdate = true;
      this.notifyParent();
    }
  }

  render() {
		const { warning1, warning2, warning3, warning4, warning5, warning6, warning7, query, tipClassName } = this.state;

		const className = ''
	
    return (
      <div className="validate-tip-container">
        <div>
          <h3>
            <span>以下Warning建议关注并修正</span>&nbsp;&nbsp;
            <Button type="primary" size="small" onClick={this.showTipDetail}>
              {tipClassName ? '查看详情' : '关闭详情'}
            </Button>
          </h3>
        </div>
        <div className={this.state.tipClassName}>
          <div>
            <Button onClick={this.props.toModify} type="primary" size="small">去修正</Button>
            &nbsp;&nbsp;
            <Button type="primary" size="small" onClick={this.showTipDetail}>知道了，暂不修改</Button>
          </div>

          {
            warning1.length
              ?
              (
                <div>
                  <h3>Warning-非兼容变更</h3>
                  <div>
                    {
                      warning1.map((val, index) => {
                        return <div key={index}>{++index}. {val}</div>
                      })
                    }
                  </div>
                </div>
              )
              : null
          }

          {
            warning2
              ?
              (
                <div>
                  <h3>Warning-未支持HTTPS</h3>
                  <div>
                    1. 要求API均支持HTTPS访问
                  </div>
                </div>
              )
              : null
          }

          {
            warning3.length
              ?
              (
                <div>
                  <h3>Warning-对称性</h3>
                </div>
              )
              : null
          }

          {
            warning4.length
              ?
              (
                <div>
                  <h3>Warning-入参</h3>
                  <div>
                    {
                      warning4.map((val, index) => {
                        return <div key={index}>{++index}. {val}</div>
                      })
                    }
                  </div>
                </div>
              )
              : null
          }

          {
            warning5.length
              ?
              (
                <div>
                  <h3>Warning-出参</h3>
                  <div>
                    {
                      warning5.map((val, index) => {
                        return <div key={index}>{++index}. {val}</div>
                      })
                    }
                  </div>
                </div>
              )
              : null
          }
          {
            warning6.length
              ?
              (
                <div>
                  <h3>Warning-API规范</h3>
                  <div>
                    {
                      warning6.map((val, index) => {
                        return <div key={index}>{++index}. {val}</div>
                      })
                    }
                  </div>
                </div>
              )
              : null
          }
          {
            warning7.length
              ?
              (
                <div>
                  <h3>Warning-path规范</h3>
                  <div>
                    {
                      warning7.map((val, index) => {
                        return <div key={index}>{++index}. {val}</div>
                      })
                    }
                  </div>
                </div>
              )
              : null
          }
          <br />
        </div>

      </div>
    )
  }
}

export default ValidateTip
