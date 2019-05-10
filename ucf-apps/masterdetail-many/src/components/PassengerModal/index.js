import { FormattedMessage, injectIntl } from 'react-intl';
import React, {Component} from "react";
import {actions} from "mirrorx";
import { FormControl, Switch, Select} from "tinper-bee";
import moment from "moment";
import DatePicker from "bee-datepicker";
import {RefIuapDept} from 'components/RefViews';
import PopDialog from 'components/Pop';
import FormControlPhone from 'components/FormControlPhone';
import FormError from 'components/FormError';
import { dateLocal } from 'components/Intl'
import FormList from 'components/FormList'
import {getValidateFieldsTrim} from "utils";
import './index.less'

const FormItem = FormList.Item;
const {Option} = Select;
const format = "YYYY-MM-DD";
let titleArr = [<FormattedMessage id="js.com.Pas.0001" defaultMessage="新增" />, <FormattedMessage id="js.com.Pas.0002" defaultMessage="修改" />, <FormattedMessage id="js.com.Pas.0003" defaultMessage="详情" />];


class AddEditPassenger extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rowData: {},
            btnFlag: 0,
            isVip: false
        }
        this.switchChildren = {
            yes: props.intl.formatMessage({id:"js.com.Pas.0018", defaultMessage:"是"}),
            no: props.intl.formatMessage({id:"js.com.Pas.0019", defaultMessage:"否"})
        }
        this.btns = null;

    }

    async componentWillReceiveProps(nextProps) {
        let {btnFlag, currentIndex} = this.props;
        let {btnFlag: nextBtnFlag, currentIndex: nextCurrentIndex, passengerObj, checkTable, modalVisible} = nextProps;
        if (btnFlag !== nextBtnFlag || currentIndex !== nextCurrentIndex) { // 弹框默认值的条件
            // 防止网络阻塞造成btnFlag显示不正常
            this.btns = this.onHandleBtns(nextProps);
            this.setState({btnFlag: nextBtnFlag});
            let isVip = false;
            // 判断是否重后端请求数据
            if (nextBtnFlag > 0 && checkTable === "passenger" && modalVisible) {
                this.props.form.resetFields();
                let {list} = passengerObj;
                let rowData = list[nextCurrentIndex] || {};
                if (rowData.isVip) isVip = rowData.isVip;
                this.setState({rowData, isVip});
            }
        }
    }


    /**
     * button关闭Modal 同时清空state
     * @param {Boolean} isSave 判断是否添加或者更新
     */
    onCloseEdit = (isSave) => {
        // 关闭当前 弹框清空当前的state的值，防止下次进入是上一次的数据
        this.setState({rowData: {}, btnFlag: 0});
        this.props.form.resetFields();
        this.props.onCloseModal(isSave);
    }


    /**
     *  提交信息
     */
    onSubmitEdit = () => {

        let { btnFlag } = this.state;
        this.props.form.validateFields(async (err, _values) => {
            let values = getValidateFieldsTrim(_values);
            if (!err) {
                let {rowData} = this.state;
                if (rowData && rowData.id) {
                    values.id = rowData.id;
                    values.ts = rowData.ts;
                }
                // 参照处理
                let {dept} = values;
                if (dept) {
                    let {refpk} = JSON.parse(dept);
                    values.dept = refpk;

                }
                // 是否会员，从state中取值
                let {isVip} = this.state; //不能使用form
                values.isVip = isVip;

                if(!isVip){ // 如果不是会员
                    values.grade = 0;
                    values.expirationDate = "";
                }

                try {
                    values.expirationDate = values.expirationDate.format(format);
                } catch (e) {
                }
                values.btnFlag=btnFlag;
                this.onCloseEdit(true); // 关闭弹框 无论成功失败
                actions.masterDetailMany.savePassenger(values); //保存主表数据

            }
        });
    }

    /**
     *
     * @description 底部按钮是否显示处理函数
     * @param {number} btnFlag 为页面标识
     * @returns footer中的底部按钮
     */
    onHandleBtns = (btnFlag) => {

        let btns = [

            {
                label: <FormattedMessage id="js.com.Pas.0004" defaultMessage="取消" />,
                fun: this.onCloseEdit,
                shape: 'border'
            },
            {
                label: <FormattedMessage id="js.com.Pas.0005" defaultMessage="确定" />,
                fun: this.onSubmitEdit,
                colors: 'primary'
            },
        ];

        if (btnFlag == 2) {
            btns = [];
        }
        return btns;
    }

    isVipOnChange = (value) => {
        this.setState({isVip: value})
    }


    render() {

        let {form, modalVisible} = this.props;

        let {getFieldProps, getFieldError,} = form;
        let {rowData, btnFlag, isVip} = this.state;

        let {code, phone, sex, grade, name, dept, deptName, expirationDate} = rowData;

        let btns = this.btns,
            isDisabled = btnFlag > 1;
        return (
            <PopDialog
                ref={node => this.dialogNode = node}
                show={modalVisible}
                size='lg'
                close={this.onCloseEdit}
                title={titleArr[btnFlag]}
                btns={btns}
                className='passenger-modal'
            >
                <FormList>
                    <FormItem label={<FormattedMessage id="js.com.Pas.0006" defaultMessage="乘客编号" />}>
                        <FormControl disabled
                                     {...getFieldProps('code', {
                                         initialValue: code || '',
                                     })}
                        />
                    </FormItem>

                    <FormItem required label={<FormattedMessage id="js.com.Pas.0007" defaultMessage="乘客姓名" />}>
                        <FormControl disabled={isDisabled}  maxLength={20}
                                     {...getFieldProps('name', {
                                         validateTrigger: 'onBlur',
                                         initialValue: name || '',
                                         rules: [{
                                             required: true, message: '请输入乘客姓名,小于20个字符',
                                             max:20
                                         }],
                                     })}
                        />
                        <FormError errorMsg={getFieldError('name')}/>
                    </FormItem>

                    <FormItem required label={<FormattedMessage id="js.com.Pas.0009" defaultMessage="部门" />}>
                        <RefIuapDept
                            disabled={btnFlag === 2}
                            {...getFieldProps('dept', {
                                validateTrigger: 'onChange',
                                initialValue: JSON.stringify({
                                    refpk: dept || "",
                                    refname: deptName || "",
                                }),
                                rules: [{
                                    message: <FormattedMessage id="js.com.Pas.0010" defaultMessage="请选择部门" />,
                                    pattern: /[^({"refname":"","refpk":""}|{"refpk":"","refname":""})]/,
                                }],
                            })}
                        />

                        <FormError errorMsg={getFieldError('dept')}/>
                    </FormItem>

                    <FormItem required label={<FormattedMessage id="js.com.Pas.0011" defaultMessage="乘客性别" />}>
                        <Select disabled={isDisabled}
                                {...getFieldProps('sex', {
                                    initialValue: sex || 1,
                                    rules: [{
                                        required: true, message: <FormattedMessage id="js.com.Pas.0012" defaultMessage="请选择乘客性别" />,
                                    }],
                                })}
                        >
                            <Option value={0}><FormattedMessage id="js.com.Pas.0013" defaultMessage="女" /></Option>
                            <Option value={1}><FormattedMessage id="js.com.Pas.0014" defaultMessage="男" /></Option>
                        </Select>
                        <FormError errorMsg={getFieldError('sex')}/>
                    </FormItem>

                    <FormItem required label={<FormattedMessage id="js.com.Pas.0015" defaultMessage="手机号" />}>
                        <FormControlPhone disabled={isDisabled}
                                          {...getFieldProps('phone', {
                                              validateTrigger: 'onBlur',
                                              initialValue: phone || '',
                                              rules: [{
                                                  required: true,
                                                  pattern: /^[1][3,4,5,7,8][0-9]{9}$/,
                                                  message: '请正确输入手机号',
                                              }],
                                          })}
                        />
                        <FormError errorMsg={getFieldError('phone')}/>
                    </FormItem>

                    <FormItem label={<FormattedMessage id="js.com.Pas.0017" defaultMessage="是否会员" />}>
                        <Switch
                            disabled={isDisabled}
                            checked={isVip}
                            checkedChildren={this.switchChildren.yes}
                            unCheckedChildren={this.switchChildren.no}
                            onChange={this.isVipOnChange}
                        />
                    </FormItem>

                    {isVip ? (
                        <FormItem required label={<FormattedMessage id="js.com.Pas.0020" defaultMessage="会员等级" />}>
                            <Select disabled={isDisabled}
                                    {...getFieldProps('grade', {
                                        initialValue: grade || 1,
                                        rules: [{
                                            required: true, message: <FormattedMessage id="js.com.Pas.0021" defaultMessage="请选择会员等级" />,
                                        }],
                                    })}
                            >
                                <Option value={1}><FormattedMessage id="js.com.Pas.0022" defaultMessage="初级会员" /></Option>
                                <Option value={2}><FormattedMessage id="js.com.Pas.0023" defaultMessage="中级会员" /></Option>
                                <Option value={3}><FormattedMessage id="js.com.Pas.0024" defaultMessage="高级会员" /></Option>
                            </Select>
                        </FormItem>
                    ) : null}

                    {isVip ? (
                        <FormItem required label={<FormattedMessage id="js.com.Pas.0025" defaultMessage="到期日期" />}>
                            <DatePicker className='form-item' format={format} disabled={isDisabled}
                                        locale={dateLocal}
                                        // getCalendarContainer={() => {
                                        //     return document.querySelector('.passenger-modal')
                                        // }}
                                        {...getFieldProps('expirationDate', {
                                            initialValue: expirationDate ? moment(expirationDate) : moment(),
                                            validateTrigger: 'onBlur',
                                            rules: [{
                                                required: true, message: <FormattedMessage id="js.com.Pas.0026" defaultMessage="请选择会员到期日期" />
                                            }],
                                        })}
                            />
                            <FormError errorMsg={getFieldError('expirationDate')}/>
                        </FormItem>
                    ) : null}
                </FormList>
            </PopDialog>
        )
    }
}

export default FormList.createForm()(AddEditPassenger);
